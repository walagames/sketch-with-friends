package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"slices"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const (
	// How often to check for idle players
	IDLE_TICK = 1 * time.Minute

	// How long a player can be idle before the room disconnects them
	PLAYER_TIMEOUT = 15 * time.Minute

	// Maximum length of a player's name
	MAX_NAME_LENGTH = 14
	MIN_NAME_LENGTH = 1

	// How often to tick the scheduler
	SCHEDULER_TICK_INTERVAL = 100 * time.Millisecond
)

var (
	// Duration allowed for players to pick a word
	PickingPhaseDuration = time.Second * 15

	// Duration after drawing for score updates and displaying the word
	PostDrawingPhaseDuration = time.Second * 6
)

type ChatMessageType string

const (
	ChatMessageTypeDefault    ChatMessageType = "default"
	ChatMessageTypeCorrect    ChatMessageType = "correct"
	ChatMessageTypeCloseGuess ChatMessageType = "close_guess"
	ChatMessageTypeSystem     ChatMessageType = "system"
)

type ChatMessage struct {
	ID       uuid.UUID       `json:"id"`
	PlayerID uuid.UUID       `json:"playerId"`
	Type     ChatMessageType `json:"type"`
	Content  string          `json:"content"`
}

// Room settings validation constants
const (
	MIN_PLAYERS      = 2
	MAX_PLAYERS      = 10
	MIN_DRAWING_TIME = 15  // seconds
	MAX_DRAWING_TIME = 240 // seconds
	MIN_ROUNDS       = 1
	MAX_ROUNDS       = 10
)

// We send these to clients to display alerts
var (
	ErrRoomNotFound      = errors.New("ErrRoomNotFound")
	ErrRoomFull          = errors.New("ErrRoomFull")
	ErrRoomClosed        = errors.New("ErrRoomClosed")
	ErrConnectionTimeout = errors.New("ErrConnectionTimeout")
	ErrRoomIdle          = errors.New("ErrRoomIdle")
	ErrPlayerIdle        = errors.New("ErrPlayerIdle")
	ErrRoomEmpty         = errors.New("ErrRoomEmpty")
	ErrNameTooLong       = errors.New("ErrNameTooLong")
)

type GameMode string

const (
	GameModeClassic GameMode = "classic"
	GameModeNoHints GameMode = "noHints"
)

type RoomSettings struct {
	PlayerLimit        int            `json:"playerLimit"`
	DrawingTimeAllowed int            `json:"drawingTimeAllowed"`
	TotalRounds        int            `json:"totalRounds"`
	WordDifficulty     WordDifficulty `json:"wordDifficulty"`
	GameMode           GameMode       `json:"gameMode"`
	WordBank           WordBank       `json:"wordBank"`
	CustomWords        []Word         `json:"customWords"`
}

// Room manages the game state, player connections, and coordinates all room-related activities.
//
// Each room runs in its own goroutine, allowing for concurrent handling of
// multiple rooms within the application.
//
// Child goroutines are spawned for each connected player, allowing us to handle
// concurrency and synchronization between the room and its players.
type Room interface {
	Close(cause error)
	Connect(conn *websocket.Conn, player *player) error
	Run(rm RoomManager)
	Code() string
}

type room struct {
	ID           string                `json:"id"`
	Settings     RoomSettings          `json:"settings"`
	Players      map[uuid.UUID]*player `json:"players"`
	CurrentRound int                   `json:"currentRound"`
	ChatMessages []ChatMessage         `json:"chatMessages"`

	// game state
	currentState  RoomState
	drawingQueue  []uuid.UUID
	currentDrawer *player

	// channels
	connect    chan *connectionAttempt
	disconnect chan *player
	command    chan *Command

	scheduler *GameScheduler

	// context
	cancel context.CancelCauseFunc
}

func NewRoom(id string) Room {
	return &room{
		ID:            id,
		Players:       make(map[uuid.UUID]*player),
		connect:       make(chan *connectionAttempt),
		disconnect:    make(chan *player),
		command:       make(chan *Command, 5),
		drawingQueue:  make([]uuid.UUID, 0),
		currentDrawer: nil,
		ChatMessages:  make([]ChatMessage, 0),
		scheduler:     NewGameScheduler(),

		Settings: RoomSettings{
			PlayerLimit:        6,
			DrawingTimeAllowed: 90,
			TotalRounds:        3,
			WordDifficulty:     WordDifficultyAll,
			GameMode:           GameModeClassic,
			WordBank:           WordBankMixed,
			CustomWords:        make([]Word, 0),
		},

		currentState: &WaitingState{},
	}
}

func (r *room) Transition() {
	// States should manage their own events
	r.currentState.Exit(r)
	r.currentState.Enter(r)
}

// Only use this if we need to exit the transiton cycle
// early. Ex. In the case that player count falls below
// the minimum required to start the game.
func (r *room) TransitionTo(state RoomState) {
	r.currentState.Exit(r)
	r.currentState = state
	r.currentState.Enter(r)
}

// Returns the room's code
func (r *room) Code() string {
	return r.ID
}

// Sets the room's current state
func (r *room) setState(state RoomState) {
	slog.Debug("setting state to", "state", state)
	r.currentState = state
}

// A connection attempt from a player to the room.
//
// We use this to take advantage of Go's concurrency features
// and synchronize the connection with the room's goroutine.
//
// This allows us to return an error through the channel if the
// connection fails.
type connectionAttempt struct {
	player *player
	result chan error
}

// Attempts to connect a player to the room, allowing the room to
// synchronize the connection with its goroutine.
func (r *room) Connect(conn *websocket.Conn, p *player) error {
	p.client = NewClient(conn, r, p)
	attempt := &connectionAttempt{
		player: p,
		result: make(chan error),
	}

	// Send connection request to the room's goroutine
	select {
	case r.connect <- attempt:
	case <-time.After(5 * time.Second):
		return ErrConnectionTimeout
	}

	// Wait for the result
	err := <-attempt.result
	return err
}

// Adds the player to the room state, initializes their client,
// and informs the other players they joined.
func (r *room) register(ctx context.Context, player *player) error {
	if len(r.Players) >= r.Settings.PlayerLimit {
		return ErrRoomFull
	}

	// Start their client and add the player to the room
	player.client.run(ctx)
	r.Players[player.ID] = player

	// Tell the other players that a new player joined
	r.broadcast(GameRoleAny,
		event(PlayerJoinedEvt, player),
	)

	// Send the player the current room state and tell them what their ID is
	player.Send(
		event(SetPlayerIdEvt, player.ID),
		event(RoomInitEvt, r),
	)

	r.dispatch(&Command{
		Type:    PlayerJoinedCmd,
		Player:  player,
		Payload: nil,
	})

	slog.Debug("player registered", "playerId", player.ID)
	return nil
}

// Removes the player from the room state, informs the other players,
// and handles necessary game state changes if they disconnect mid-game.
func (room *room) unregister(player *player) {
	// Remove player's guesses if they leave during the drawing phase:
	// 1. Prevents frontend errors when rendering guesses (avoids lookup of non-existent player)
	// 2. Useful for scenarios like kicking players for offensive language
	// Note: This is a design choice that may have future benefits.
	room.dispatch(&Command{
		Type:    PlayerLeftCmd,
		Payload: player.ID,
		Player:  player,
	})

	// Filter out the player's messages
	newChatMessages := make([]ChatMessage, 0)
	for _, g := range room.ChatMessages {
		if g.PlayerID != player.ID {
			newChatMessages = append(newChatMessages, g)
		}
	}
	room.ChatMessages = newChatMessages

	room.broadcast(GameRoleAny, event(SetChatEvt, room.ChatMessages))
	room.SendSystemMessage(fmt.Sprintf("%s left the room", player.Username))
	room.removePlayerFromDrawingQueue(player.ID)

	// Tell the other players that a player left
	// Note: This needs to be done before we remove the player from the room state
	// otherwise the alert will not display to the other players.
	room.broadcast(
		GameRoleAny,
		event(PlayerLeftEvt, player.ID),
	)

	// If the player is the host, we need to migrate the host role to a new player
	if player.RoomRole == RoomRoleHost {
		// Assign the host role to the first player we find
		for _, p := range room.Players {
			if p.ID == player.ID {
				continue
			}
			p.RoomRole = RoomRoleHost
			room.broadcast(
				GameRoleAny,
				event(SetPlayersEvt, room.Players),
			)
			slog.Debug("host changed to", "playerId", p.ID)
			break
		}
	}

	// Remove the player from the room state
	delete(room.Players, player.ID)

	// If there are no players left in the room, we need to cancel the game
	// and reset the room state.
	if len(room.Players) == 0 {
		room.cancel(errors.New("no players left in room"))
		slog.Debug("no players left in room, closing room", "id", room.ID)
		return
	}

	// If there are less than 2 players left in the room, we need to cancel the game
	// and reset the room state since there's no way to continue the game.
	// ! i dont like this, it should go in the command hanlders i think
	if len(room.Players) < 2 {
		room.scheduler.clearEvents()
		room.TransitionTo(NewWaitingState())

		// Tell the remaining player that the game has ended
		// ! this should prob go to the game over state
		room.broadcast(GameRoleAny,
			event(SetCurrentStateEvt, Waiting),
			event(Error, "Not enough players to continue game"),
		)
	} else if player.GameRole == GameRoleDrawing {
		slog.Debug("player left during drawing phase, transitioning to post-drawing phase")
		room.Transition()
	}

	slog.Debug("player unregistered", "playerId", player.ID)
}

// Sends actions to players with a specific game role or all players if role is GameRoleAny
//
// For example, we use this to send the hinted word only to guessing players
// since the drawing player already knows the real world word.
func (r *room) broadcast(role GameRole, events ...*Event) {
	for _, player := range r.Players {
		if role == GameRoleAny || player.GameRole == role {
			// Veriatic function arugments allow us to send arbitrary number of actions
			// to the player as a single call.
			//
			// Read more: https://gobyexample.com/variadic-functions
			player.Send(events...)
		}
	}
}

// Dispatches an action to the room, validating it and executing it.
//
// This is the single entry point for incoming actions being sent from clients.
// See more about how actions work in action.go.
func (r *room) dispatch(cmd *Command) {
	player := cmd.Player
	player.lastInteractionAt = time.Now()

	switch cmd.Type {
	case UpdatePlayerProfileCmd:
		r.handlePlayerProfileChange(cmd)
	case ChatMessageCmd:
		err := r.currentState.HandleCommand(r, cmd)
		if err != nil {
			slog.Debug("handling chat message at room level from player", "playerId", player.ID)
			msg := sanitizeChatMessage(cmd.Payload.(string))
			r.handleChatMessage(ChatMessage{
				ID:       uuid.New(),
				PlayerID: player.ID,
				Content:  msg,
				Type:     ChatMessageTypeDefault,
			})
		}
	default:
		r.currentState.HandleCommand(r, cmd)
	}

}

type PlayerProfileChange struct {
	Username     string        `json:"username"`
	AvatarConfig *AvatarConfig `json:"avatarConfig"`
}

func (r *room) handlePlayerProfileChange(cmd *Command) error {
	// Decode the payload
	profile, err := decodePayload[PlayerProfileChange](cmd.Payload)
	if err != nil {
		return fmt.Errorf("invalid player profile payload: %w", err)
	}

	// Validate and sanitize the profile
	validatedProfile, err := validatePlayerProfile(&profile)
	if err != nil {
		slog.Error("profile validation failed", "error", err)
		return fmt.Errorf("profile validation failed: %w", err)
	}

	// Show join message if new player
	if cmd.Player.Username == "" {
		r.SendSystemMessage(fmt.Sprintf("%s joined the room", validatedProfile.Username))
	}

	// Update the player's profile with validated data
	cmd.Player.Username = validatedProfile.Username
	cmd.Player.AvatarConfig = validatedProfile.AvatarConfig

	// Broadcast the change to all players
	r.broadcast(GameRoleAny,
		event(SetPlayersEvt, r.Players),
	)
	return nil
}

// Runs the room's goroutine, handling connections, disconnections,
// actions, and idle detection.
//
// We launch this as a goroutine directly from /host route handler.
func (r *room) Run(rm RoomManager) {
	slog.Info("Room created", "id", r.ID)

	// We use a cancelable context for graceful room shutdowns:
	//
	// 1. The room has a main context.
	// 2. When a new client connects, we create a child context from the room's context.
	// 3. If the room needs to shut down, canceling the main context will also cancel all client contexts.
	// 4. This ensures all goroutines (room and clients) are properly terminated, preventing leaks.
	// 5. We also use this context to propagate cancellation causes to the clients to tell them why the room was closed.
	ctx, cancel := context.WithCancelCause(context.Background())
	r.cancel = cancel
	defer cancel(nil)

	// Used to check for idle players on a regular interval
	idleTicker := time.NewTicker(IDLE_TICK)
	defer idleTicker.Stop()

	// Used to tick the scheduler
	schedulerTicker := time.NewTicker(SCHEDULER_TICK_INTERVAL)
	defer schedulerTicker.Stop()

	// This runs when this routine exits, we can do cleanup here
	defer func() {
		slog.Debug("Room routine exiting, unregistering room", "id", r.ID)
		rm.Unregister(r.ID)
	}()

	for {
		select {
		// This channel triggers when the cancel function is called
		case <-ctx.Done():
			slog.Debug("Room routine cancelled", "id", r.ID, "cause", context.Cause(ctx))
			return
		case <-idleTicker.C:
			for _, player := range r.Players {
				// Disconnect players that haven't interacted with the room in a while
				if time.Since(player.lastInteractionAt) > PLAYER_TIMEOUT {
					player.client.close(ErrPlayerIdle)
					slog.Debug("Player is idle, disconnecting",
						"player", player.ID,
						"time_since", time.Since(player.lastInteractionAt).Round(time.Second).String(),
					)
				}
			}
		case <-schedulerTicker.C:
			// Tick the scheduler
			r.scheduler.tick(SCHEDULER_TICK_INTERVAL)
		case req := <-r.connect:
			// A new client has connected to the room
			req.result <- r.register(ctx, req.player)
		case player := <-r.disconnect:
			// A client has disconnected from the room
			r.unregister(player)
		case cmd := <-r.command:
			// Client routines send commands to the room via this channel
			r.dispatch(cmd)
		}

	}
}

// Closes the room with a cause.
// We use this to propagate close messages to clients
// which derived their context from the room's context.
func (r *room) Close(cause error) {
	r.cancel(cause)
}

// Resets the player states for a new round
func (r *room) resetGameState() {
	for _, p := range r.Players {
		p.GameRole = GameRoleGuessing
		p.Score = 0
		p.Streak = 0
	}

	r.currentDrawer = nil
	r.drawingQueue = make([]uuid.UUID, 0)
	r.CurrentRound = 0
}

// Not the same as dequeueDrawingPlayer which returns the next player in the queue.
// This specifically is used when a player leaves mid-game and we need to manually
// remove them from the queue.
func (r *room) removePlayerFromDrawingQueue(playerID uuid.UUID) {
	for i, id := range r.drawingQueue {
		if id == playerID {
			r.drawingQueue = append(r.drawingQueue[:i], r.drawingQueue[i+1:]...)
			break
		}
	}
}

func (r *room) enqueueDrawingPlayer(player *player) {
	r.drawingQueue = append(r.drawingQueue, player.ID)
}

// ! im gonna dleete this later
func (room *room) SendSystemMessage(message string) {
	newMessage := ChatMessage{
		ID:       uuid.New(),
		PlayerID: uuid.Nil,
		Content:  message,
		Type:     ChatMessageTypeSystem,
	}
	room.handleChatMessage(newMessage)
}

// Returns the next player in the drawing queue
func (room *room) getNextDrawingPlayer() *player {
	if len(room.drawingQueue) == 0 {
		return nil
	}
	next := room.drawingQueue[0]
	room.drawingQueue = room.drawingQueue[1:]
	return room.Players[next]
}

// Initializes the drawing queue with all players.
// The queue is sorted by score, so the first player in the queue
// is the player with the highest score.
// ! idk if i like the way this is named
func (room *room) fillDrawingQueue() {
	// Clear existing queue
	room.drawingQueue = make([]uuid.UUID, 0)

	// Convert map to slice
	players := make([]*player, 0, len(room.Players))
	for _, p := range room.Players {
		players = append(players, p)
	}

	// Sort players by score
	slices.SortFunc(players, func(a, b *player) int {
		return int(b.Score - a.Score)
	})

	// Add sorted players to queue
	for _, p := range players {
		room.drawingQueue = append(room.drawingQueue, p.ID)
	}
}

func (room *room) handleChatMessage(msg ChatMessage) error {
	room.ChatMessages = append(room.ChatMessages, msg)
	room.broadcast(GameRoleAny, event(NewChatMessageEvt, msg))
	return nil
}
