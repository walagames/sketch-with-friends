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
	IDLE_TICK      = 1 * time.Minute  // How often to check for idle players
	PLAYER_TIMEOUT = 10 * time.Minute // How long a player can be idle before the room disconnects them
)

// Error codes
var (
	ErrRoomNotFound      = errors.New("ErrRoomNotFound")
	ErrRoomFull          = errors.New("ErrRoomFull")
	ErrRoomClosed        = errors.New("ErrRoomClosed")
	ErrConnectionTimeout = errors.New("ErrConnectionTimeout")
	ErrRoomIdle          = errors.New("ErrRoomIdle")
	ErrPlayerIdle        = errors.New("ErrPlayerIdle")
	ErrRoomEmpty         = errors.New("ErrRoomEmpty")
)

type Room interface {
	Close(cause error)
	Connect(conn *websocket.Conn, player *player) error
	Run(rm RoomManager)
	LastInteractionAt() time.Time
	Code() string
}

type RoomSettings struct {
	PlayerLimit        int `json:"playerLimit"`
	DrawingTimeAllowed int `json:"drawingTimeAllowed"`
	TotalRounds        int `json:"totalRounds"`
}

type RoomStage string

const (
	PreGame RoomStage = "preGame"
	Playing RoomStage = "playing"
)

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
		},
		Stage: PreGame,
	}
}

func (r *room) Code() string {
	return r.ID
}

func (r *room) LastInteractionAt() time.Time {
	return r.lastInteractionAt
}

func (r *room) setStage(stage RoomStage) {
	r.Stage = stage
}

// Broadcast actions to players with a specific game role or all players if role is GameRoleAny
func (r *room) broadcast(role GameRole, actions ...*Action) {
	for _, player := range r.Players {
		if role == GameRoleAny || player.GameRole == role {
			player.Send(actions...)
		}
	}
}

type connectionAttempt struct {
	player *player
	result chan error
}

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

func (r *room) Close(cause error) {
	r.cancel(cause)
}

func (r *room) register(ctx context.Context, player *player) error {
	r.lastInteractionAt = time.Now()
	if len(r.Players) >= r.Settings.PlayerLimit {
		return ErrRoomFull
	}

	player.client.run(ctx)
	r.Players[player.ID] = player

	slog.Debug("player connected", "player", player.ID)

	r.broadcast(GameRoleAny,
		message(PlayerJoined, player),
	)

	player.Send(
		message(InitializeClient, player.ID),
		message(InitializeRoom, r),
	)

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
		)
	}

	return nil
}

// TODO: reduce cognitive load of this function
func (r *room) unregister(player *player) {
	r.lastInteractionAt = time.Now()

	slog.Debug("player unregistered", "player", player.ID)
	if r.game != nil && r.game.currentPhase.Name() == Drawing {
		r.game.handlePlayerLeave(player)
	}

	r.broadcast(
		GameRoleAny,
		message(PlayerLeft, player.ID),
	)

	delete(r.Players, player.ID)
	if len(r.Players) == 0 {
		if r.Stage == Playing && r.game != nil && r.game.currentPhase.Name() == Drawing {
			r.game.cancelHintRoutine()
		}
		r.cancel(errors.New("no players left in room"))
		return
	}

	if player.RoomRole == RoomRoleHost {
		// Migrate host role to the next player
		for _, player := range r.Players {
			player.RoomRole = RoomRoleHost
			r.broadcast(
				GameRoleAny,
				message(SetPlayers, r.Players),
			)
			slog.Debug("host changed", "player", player.Name)
			break
		}
	}

	if len(r.Players) < 2 && r.Stage == Playing {
		if r.game != nil && r.game.currentPhase.Name() == Drawing {
			r.game.cancelHintRoutine()
		}
		r.Stage = PreGame
		r.timer.Stop()
		r.game = nil
		r.broadcast(GameRoleAny, message(ChangeStage, r.Stage), message(Error, "Not enough players to continue game"))
	}

}

func (r *room) Run(rm RoomManager) {
	slog.Info("Room created", "id", r.ID)
	ctx, cancel := context.WithCancelCause(context.Background())
	r.cancel = cancel
	defer cancel(nil)

	idleTicker := time.NewTicker(IDLE_TICK)
	defer idleTicker.Stop()

	// set timer to a very large number so it doesn't trigger until the first transition
	r.timer = time.NewTimer(time.Duration(1<<63 - 1))
	defer r.timer.Stop()

	defer func() {
		if r.Stage == Playing && r.game != nil && r.game.currentPhase.Name() == "drawing" {
			r.game.cancelHintRoutine()
		}

		slog.Debug("Room routine exited", "id", r.ID)
		rm.Unregister(r.ID)
	}()
	for {
		select {
		case <-ctx.Done():
			slog.Debug("Room routine cancelled", "id", r.ID, "cause", context.Cause(ctx))
			return
		case <-idleTicker.C:
			for _, player := range r.Players {
				if time.Since(player.lastInteractionAt) > PLAYER_TIMEOUT {
					slog.Info("Player is idle, disconnecting",
						"player", player.ID,
						"time_since", time.Since(player.lastInteractionAt).Round(time.Second).String(),
					)
					player.client.close(ErrPlayerIdle)
				}
			}
		case <-r.timer.C:
			r.game.currentPhase.Next(r.game)
		case req := <-r.connect:
			req.result <- r.register(ctx, req.player)
		case player := <-r.disconnect:
			r.unregister(player)
		case a := <-r.action:
			r.dispatch(a)
		}

	}
}

func (r *room) dispatch(a *Action) {
	r.lastInteractionAt = time.Now()
	a.Player.lastInteractionAt = time.Now()

	def, exists := ActionDefinitions[a.Type]
	if !exists {
		slog.Debug("unknown action", "action", a.Type)
		a.Player.Send(message(Error, "unknown action"))
		return
	}

	err := def.ValidateAction(r, a)
	if err != nil {
		slog.Debug("action validation failed", "reason", err)
		a.Player.Send(message(Error, err.Error()))
		return
	}

	err = def.execute(r, a)
	if err != nil {
		slog.Debug("action execution failed", "reason", err)
		a.Player.Send(message(Error, err.Error()))
		return
	}
}
