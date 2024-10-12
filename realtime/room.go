package main

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Room interface {
	Close()
	Connect(conn *websocket.Conn, player *player) error
	Run(rm RoomManager)
}

type RoomSettings struct {
	PlayerLimit        int `json:"playerLimit"`
	DrawingTimeAllowed int `json:"drawingTimeAllowed"`
	TotalRounds        int `json:"totalRounds"`
}

type RoomStage string

const (
	PreGame  RoomStage = "preGame"
	Playing  RoomStage = "playing"
	PostGame RoomStage = "postGame"
)

type room struct {
	ID       string                `json:"id"`
	Settings RoomSettings          `json:"settings"`
	Players  map[uuid.UUID]*player `json:"players"`

	// game state
	Stage RoomStage `json:"stage"`
	game  *gameState

	// channels
	connect    chan *connectionAttempt
	disconnect chan *player
	action     chan *Action

	// timer
	timer *time.Timer

	// context
	cancel context.CancelFunc
}

func NewRoom(id string) Room {
	return &room{
		ID:         id,
		Players:    make(map[uuid.UUID]*player),
		connect:    make(chan *connectionAttempt),
		disconnect: make(chan *player),
		action:     make(chan *Action, 5),
		Settings: RoomSettings{
			PlayerLimit:        6,
			DrawingTimeAllowed: 60,
			TotalRounds:        3,
		},
		Stage: PreGame,
	}
}

// Broadcast actions to players with a specific game role or all players if role is GameRoleAny
func (r *room) broadcast(role GameRole, actions ...*Action) {
	for _, player := range r.Players {
		if role == GameRoleAny || player.GameRole == role {
			player.Send(actions...)
		}
	}
}

// Connection failure codes
var (
	ErrRoomNotFound      = errors.New("ErrRoomNotFound")
	ErrRoomFull          = errors.New("ErrRoomFull")
	ErrRoomClosed        = errors.New("ErrRoomClosed")
	ErrConnectionTimeout = errors.New("ErrConnectionTimeout")
)

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

func (r *room) Close() {
	r.cancel()
}

func (r *room) register(ctx context.Context, player *player) error {
	if len(r.Players) >= r.Settings.PlayerLimit {
		return ErrRoomFull
	}

	player.client.run(ctx)
	r.Players[player.ID] = player

	slog.Info("player connected", "player", player.ID)

	r.broadcast(GameRoleAny,
		message(PlayerJoined, player),
	)

	player.Send(
		message(InitializeClient, player.ID),
		message(InitializeRoom, r),
	)

	if r.Stage == Playing {
		player.Send(
			message(ChangePhase, PhaseChangeMessage{
				Phase:    r.game.currentPhase.Name(),
				Deadline: r.game.currentPhaseDeadline,
			}),
			message(SetStrokes, r.game.strokes),
			message(SelectWord, r.game.currentWord), // ! need to send the hinted word instead
			message(SetRound, r.game.currentRound),
			message(SetGuesses, r.game.guesses),
		)
	}

	return nil
}

// TODO: reduce cognitive load of this function
func (r *room) unregister(player *player) {
	slog.Info("player unregistered", "player", player.ID)
	r.broadcast(
		GameRoleAny,
		message(PlayerLeft, player.ID),
	)

	delete(r.Players, player.ID)
	if len(r.Players) == 0 {
		r.cancel()
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
			slog.Info("host changed", "player", player.Name)
			break
		}
	}

}

func (r *room) Run(rm RoomManager) {
	slog.Info("Room routine started", "id", r.ID)
	ctx, cancel := context.WithCancel(context.Background())
	r.cancel = cancel
	defer cancel()

	// set timer to a very large number so it doesn't trigger until the first transition
	r.timer = time.NewTimer(time.Duration(1<<63 - 1))
	defer r.timer.Stop()

	defer func() {
		slog.Info("Room routine exited", "id", r.ID)
		rm.Unregister(r.ID)
	}()
	for {
		select {
		case <-ctx.Done():
			for _, p := range r.Players {
				p.client.close()
			}
			return
		case <-r.timer.C:
			slog.Info("Room tick", "id", r.ID)
			r.game.Transition()
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
	def, exists := ActionDefinitions[a.Type]
	if !exists {
		slog.Warn("action definition not found", "action", a.Type)
		a.Player.Send(message(Error, "action definition not found"))
		return
	}

	err := def.Before(r, a)
	if err != nil {
		slog.Warn("action validation failed", "reason", err)
		a.Player.Send(message(Error, err.Error()))
		return
	}

	err = def.Execute(r, a)
	if err != nil {
		slog.Warn("action execution failed", "reason", err)
		a.Player.Send(message(Error, err.Error()))
		return
	}

	err = def.After(r, a)
	if err != nil {
		slog.Warn("action after failed", "reason", err)
		a.Player.Send(message(Error, err.Error()))
		return
	}
}
