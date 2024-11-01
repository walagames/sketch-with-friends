package main

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const (
	// How often to check for idle players
	IDLE_TICK = 1 * time.Minute

	// How long a player can be idle before the room disconnects them
	PLAYER_TIMEOUT = 10 * time.Minute
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
)

type WordDifficulty string

const (
	WordDifficultyEasy   WordDifficulty = "easy"
	WordDifficultyMedium WordDifficulty = "medium"
	WordDifficultyHard   WordDifficulty = "hard"
	WordDifficultyRandom WordDifficulty = "random"
	WordDifficultyCustom WordDifficulty = "custom"
)

type WordBank string

const (
	WordBankDefault WordBank = "default"
	WordBankCustom  WordBank = "custom"
	WordBankMixed   WordBank = "mixed"
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
	CustomWords        []string       `json:"customWords"`
}

type RoomStage string

const (
	PreGame RoomStage = "preGame"
	Playing RoomStage = "playing"
)

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
	LastInteractionAt() time.Time
	Code() string
}

type room struct {
	ID                string                `json:"id"`
	Settings          RoomSettings          `json:"settings"`
	Players           map[uuid.UUID]*player `json:"players"`
	lastInteractionAt time.Time

	// game state
	Stage RoomStage `json:"stage"`
	game  *game

	// channels
	connect    chan *connectionAttempt
	disconnect chan *player
	action     chan *Action

	// timer
	timer *time.Timer

	// context
	cancel context.CancelCauseFunc
}

func NewRoom(id string) Room {
	return &room{
		ID:                id,
		Players:           make(map[uuid.UUID]*player),
		connect:           make(chan *connectionAttempt),
		disconnect:        make(chan *player),
		action:            make(chan *Action, 5),
		lastInteractionAt: time.Now(),
		Settings: RoomSettings{
			PlayerLimit:        6,
			DrawingTimeAllowed: 60,
			TotalRounds:        3,
			WordDifficulty:     WordDifficultyRandom,
			GameMode:           GameModeClassic,
			WordBank:           WordBankMixed,
			CustomWords:        make([]string, 0),
		},
		Stage: PreGame,
	}
}

// Returns the room's code
func (r *room) Code() string {
	return r.ID
}

// Returns the time of the last interaction with the room.
// We use this to detect if the room is idle within the RoomManager.
func (r *room) LastInteractionAt() time.Time {
	return r.lastInteractionAt
}

// Sets the room's stage: PreGame or Playing
func (r *room) setStage(stage RoomStage) {
	r.Stage = stage
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
	r.lastInteractionAt = time.Now()
	if len(r.Players) >= r.Settings.PlayerLimit {
		return ErrRoomFull
	}

	// Start the client's goroutines
	// Note: This launches 2 separate goroutines:
	// - one for sending messages to the client
	// - one for receiving messages from the client
	// client.run() blocks until both routines are confirmed to be started.
	player.client.run(ctx)
	r.Players[player.ID] = player

	// Tell the other players that a new player joined
	r.broadcast(GameRoleAny,
		message(PlayerJoined, player),
	)

	// Send the player the current room state and tell them what their ID is
	player.Send(
		message(InitializeClient, player.ID),
		message(InitializeRoom, r),
	)

	// If the room is already playing, we need to send them the game state as well
	// and add them to the drawing queue.
	if r.Stage == Playing {
		r.game.enqueueDrawingPlayer(player)
		player.Send(
			message(ChangePhase, PhaseChangeMessage{
				Phase:    r.game.currentPhase.Name(),
				Deadline: r.game.currentPhaseDeadline,
			}),
			message(SetStrokes, r.game.strokes),
			message(SelectWord, r.game.hintedWord),
			message(SetRound, r.game.currentRound),
			message(SetGuesses, r.game.guesses),
			message(PointsAwarded, r.game.pointsAwarded),
		)
	}

	slog.Debug("player registered", "playerId", player.ID)
	return nil
}

// Removes the player from the room state, informs the other players,
// and handles necessary game state changes if they disconnect mid-game.
func (r *room) unregister(player *player) {
	r.lastInteractionAt = time.Now()
	
	// If a game is in progress, we need to purge them from the game state
	// and handle the necessary game state changes. ex. If they were drawing,
	// we need to manually force the game to the next phase.
	if r.game != nil && r.game.currentPhase.Name() == Drawing {
		r.game.handlePlayerLeave(player)
	}	
	
	// Tell the other players that a player left
	// Note: This needs to be done before we remove the player from the room state
	// otherwise the alert will not display to the other players.
	r.broadcast(
		GameRoleAny,
		message(PlayerLeft, player.ID),
	)

	// Remove the player from the room state
	delete(r.Players, player.ID)

	// If the player is the host, we need to migrate the host role to a new player
	if player.RoomRole == RoomRoleHost {
		// Assign the host role to the first player we find
		for _, p := range r.Players {
			p.RoomRole = RoomRoleHost
			r.broadcast(
				GameRoleAny,
				message(SetPlayers, r.Players),
			)
			slog.Debug("host changed to", "playerId", p.ID)
			break
		}
	}

	// If there are no players left in the room, we need to cancel the game
	// and reset the room stage.
	if len(r.Players) == 0 {
		if r.Stage == Playing && r.game != nil && r.game.currentPhase.Name() == Drawing {
			r.game.cancelHintRoutine()
		}
		r.cancel(errors.New("no players left in room"))
		slog.Debug("no players left in room, closing room", "id", r.ID)
		return
	}

	// If there are less than 2 players left in the room, we need to cancel the game
	// and reset the room stage since there's no way to continue the game.
	if len(r.Players) < 2 && r.Stage == Playing {
		// If we were in the drawing phase, we need to cancel the hint routine
		// to avoid leaking goroutines.
		if r.game != nil && r.game.currentPhase.Name() == Drawing {
			r.game.cancelHintRoutine()
		}

		// Reset the room stage and stop the timer
		r.Stage = PreGame
		r.timer.Stop()
		r.game = nil

		// Tell the remaining player that the game has ended
		r.broadcast(GameRoleAny,
			message(ChangeStage, r.Stage),
			message(Error, "Not enough players to continue game"),
		)
	}

	slog.Debug("player unregistered", "playerId", player.ID)
}

// Sends actions to players with a specific game role or all players if role is GameRoleAny
//
// For example, we use this to send the hinted word only to guessing players
// since the drawing player already knows the real world word.
func (r *room) broadcast(role GameRole, actions ...*Action) {
	for _, player := range r.Players {
		if role == GameRoleAny || player.GameRole == role {
			// Veriatic function arugments allow us to send arbitrary number of actions
			// to the player as a single call.
			//
			// Read more: https://gobyexample.com/variadic-functions
			player.Send(actions...)
		}
	}
}

// Dispatches an action to the room, validating it and executing it.
//
// This is the single entry point for incoming actions being sent from clients.
// See more about how actions work in action.go.
func (r *room) dispatch(a *Action) {
	r.lastInteractionAt = time.Now()
	a.Player.lastInteractionAt = time.Now()

	// Lookup the action definition
	def, exists := ActionDefinitions[a.Type]
	if !exists {
		slog.Debug("unknown action", "action", a.Type)
		a.Player.Send(message(Error, "unknown action"))
		return
	}

	// Check permissions, validate payload, and preconditions
	err := def.ValidateAction(r, a)
	if err != nil {
		slog.Debug("action validation failed", "reason", err)
		a.Player.Send(message(Error, err.Error()))
		return
	}

	// Perform the action
	err = def.execute(r, a)
	if err != nil {
		slog.Debug("action execution failed", "reason", err)
		a.Player.Send(message(Error, err.Error()))
		return
	}
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

	// Used to transition between game phases
	// We initialize it to a very large number so it doesn't trigger until the first transition
	r.timer = time.NewTimer(time.Duration(1<<63 - 1))
	defer r.timer.Stop()

	// This runs when this routine exits, we can do cleanup here
	defer func() {
		// If we're in the drawing phase, we need to make sure to cancel the hint routine
		// so we don't leak any goroutines.
		if r.Stage == Playing && r.game != nil && r.game.currentPhase.Name() == "drawing" {
			r.game.cancelHintRoutine()
		}

		// Tell the room manager to delete the room from its registry
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
		case <-r.timer.C:
			// Transition the game to the next phase when the timer fires
			r.game.currentPhase.Next(r.game)
		case req := <-r.connect:
			// A new client has connected to the room
			req.result <- r.register(ctx, req.player)
		case player := <-r.disconnect:
			// A client has disconnected from the room
			r.unregister(player)
		case a := <-r.action:
			// Client routines send actions to the room via this channel
			r.dispatch(a)
		}

	}
}

// Closes the room with a cause.
// We use this to propagate close messages to clients
// which derived their context from the room's context.
func (r *room) Close(cause error) {
	r.cancel(cause)
}
