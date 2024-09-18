package main

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/gorilla/websocket"
)

type Room interface {
	StateMsg() []byte
	Player(id string) Player
	Players() []Player
	Close()
	Connect(conn *websocket.Conn, role PlayerRole, name string, avatarSeed string, avatarColor string) error
	Run(rm RoomManager)
	Broadcast(msg []byte)
	BroadcastExcept(msg []byte, excludePlayer Player)
	ChangeSettings(settings RoomSettings)
	Status() RoomStatus
	ChangeStatus(status RoomStatus)
}

// Connection failure codes
var (
	RoomNotFound      = errors.New("ROOM_NOT_FOUND")
	RoomFull          = errors.New("ROOM_FULL")
	RoomClosed        = errors.New("ROOM_CLOSED")
	ConnectionTimeout = errors.New("CONNECTION_TIMEOUT")
)

type RoomStatus string

const (
	WAITING  RoomStatus = "WAITING"
	PLAYING  RoomStatus = "PLAYING"
	FINISHED RoomStatus = "FINISHED"
)

type RoomState struct {
	Status  RoomStatus `json:"status,omitempty"`
	Code    string     `json:"code,omitempty"`
	Players []Player   `json:"players,omitempty"`
	Strokes []Stroke   `json:"strokes,omitempty"`
}

type RoomEventType string

const (
	START_GAME           RoomEventType = "START_GAME"
	STATE                RoomEventType = "STATE"
	STROKE               RoomEventType = "STROKE"
	STROKE_POINT         RoomEventType = "STROKE_POINT"
	CLEAR_STROKES        RoomEventType = "CLEAR_STROKES"
	UNDO_STROKE          RoomEventType = "UNDO_STROKE"
	PLAYER_JOINED        RoomEventType = "PLAYER_JOINED"
	PLAYER_LEFT          RoomEventType = "PLAYER_LEFT"
	HOST_CHANGED         RoomEventType = "HOST_CHANGED"
	CHANGE_SETTINGS      RoomEventType = "CHANGE_SETTINGS"
	GAME_STATE           RoomEventType = "GAME_STATE"
	GAME_STARTED         RoomEventType = "GAME_STARTED"
	PICK_WORD            RoomEventType = "PICK_WORD"
	INITIALIZE_PLAYER_ID RoomEventType = "INITIALIZE_PLAYER_ID"
	WORD_OPTIONS         RoomEventType = "WORD_OPTIONS"
	GUESS                RoomEventType = "GUESS"
	GUESS_RESPONSE       RoomEventType = "GUESS_RESPONSE"
)

type RoomEvent struct {
	Type    RoomEventType `json:"type"`
	Payload interface{}   `json:"payload"`
	Player  Player
}

type room struct {
	code       string
	players    map[Player]*client
	connect    chan *connectionAttempt
	disconnect chan *client
	event      chan *RoomEvent
	game       Game
	status     RoomStatus
	cancel     context.CancelFunc
	settings   RoomSettings
}

type RoomSettings struct {
	IsRoomOpen  bool `json:"isRoomOpen"`
	PlayerLimit int  `json:"playerLimit"`
	DrawingTime int  `json:"drawingTime"`
	Rounds      int  `json:"rounds"`
}

type RoomInfo struct {
	Status   RoomStatus    `json:"status"`
	Code     string        `json:"code"`
	Players  []*PlayerInfo `json:"players"`
	Settings RoomSettings  `json:"settings"`
}

func (r *room) Info() *RoomInfo {
	players := []*PlayerInfo{}
	for _, player := range r.Players() {
		players = append(players, player.Info())
	}
	return &RoomInfo{
		Status:   r.status,
		Code:     r.code,
		Players:  players,
		Settings: r.settings,
	}
}

func NewRoom(code string) Room {
	return &room{
		code:       code,
		status:     WAITING,
		players:    make(map[Player]*client),
		connect:    make(chan *connectionAttempt),
		disconnect: make(chan *client),
		event:      make(chan *RoomEvent),
		settings: RoomSettings{
			IsRoomOpen:  true,
			PlayerLimit: 6,
			DrawingTime: 60,
			Rounds:      3,
		},
	}
}

func (r *room) Status() RoomStatus {
	return r.status
}

func (r *room) ChangeStatus(status RoomStatus) {
	r.status = status
}

func (r *room) Player(id string) Player {
	for p := range r.players {
		if p.Info().ID == id {
			return p
		}
	}
	return nil
}

func (r *room) ChangeSettings(settings RoomSettings) {
	r.settings = settings
}

func (r *room) Players() []Player {
	playerList := []Player{}
	for player := range r.players {
		playerList = append(playerList, player)
	}
	return playerList
}

type connectionAttempt struct {
	client *client
	result chan error
}

func (r *room) Connect(conn *websocket.Conn, role PlayerRole, name string, avatarSeed string, avatarColor string) error {
	player := NewPlayer(role, name, avatarSeed, avatarColor)
	client := NewClient(conn, r, player)
	player.SetClient(client)

	attempt := &connectionAttempt{
		client: client,
		result: make(chan error),
	}

	// Send connection request to the room's goroutine
	select {
	case r.connect <- attempt:
	case <-time.After(5 * time.Second):
		return ConnectionTimeout
	}

	// Wait for the result
	err := <-attempt.result
	return err
}

func (r *room) Disconnect(p Player) {
	r.disconnect <- r.players[p]
}

func (r *room) Broadcast(msg []byte) {
	for _, client := range r.players {
		client.Send(msg)
	}
}

func (r *room) Close() {
	r.cancel()
}

func (r *room) Run(rm RoomManager) {
	slog.Info("Room routine started", "code", r.code)
	ctx, cancel := context.WithCancel(context.Background())
	r.cancel = cancel
	defer cancel()

	defer func() {
		slog.Info("Room routine exited", "code", r.code)
		rm.DeleteRoom(r.code)
	}()
	for {
		select {
		case <-ctx.Done():
			for _, c := range r.players {
				c.Close()
			}
			return
		case req := <-r.connect:
			if !r.settings.IsRoomOpen {
				req.result <- RoomClosed
				continue
			}
			if len(r.players) >= r.settings.PlayerLimit {
				req.result <- RoomFull
				continue
			}

			req.client.Run(ctx)
			r.players[req.client.Player] = req.client

			slog.Info("player connected", "player", req.client.Player.Info().ID)

			req.client.Send(marshalEvent(INITIALIZE_PLAYER_ID, req.client.Player.Info().ID))

			req.client.Send(r.StateMsg())

			r.BroadcastExcept(marshalEvent(PLAYER_JOINED, req.client.Player.Info()), req.client.Player)
		case client := <-r.disconnect:
			role := client.Player.Role()
			slog.Info("player disconnected", "player", client.Player.Info().ID, "role", role)
			r.BroadcastExcept(marshalEvent(PLAYER_LEFT, client.Player.Info()), client.Player)
			delete(r.players, client.Player)
			if len(r.players) == 0 {
				r.cancel()
				// continue
			} else if role == RoleHost {
				// Migrate host role to the next player
				for player := range r.players {
					player.ChangeRole(RoleHost)
					slog.Info("host changed", "player", player.Info().Name)
					r.Broadcast(r.StateMsg())
					break
				}
			}

			// minimum 2 players required to continue the game
			if r.status == PLAYING && len(r.players) < 2 {
				slog.Info("less than 2 players remain, ending game")
				r.game.End()
				r.status = FINISHED
			}
		case e := <-r.event:
			switch e.Type {
			case START_GAME:
				if e.Player.Role() == RoleHost && r.status == WAITING {
					r.game = NewGame(r.settings.Rounds, r.settings.DrawingTime)
					go r.game.Run(ctx, r)
					r.status = PLAYING
					r.Broadcast(marshalEvent(GAME_STARTED, time.Now().Add(time.Duration(CountdownTime)).UTC()))
				}
			case CHANGE_SETTINGS:
				settings, err := decodePayload[RoomSettings](e.Payload)
				if err != nil {
					slog.Warn("failed to decode settings", "error", err)
					return
				}
				slog.Info("settings changed", "settings", settings)
				r.ChangeSettings(settings)
				r.Broadcast(marshalEvent(CHANGE_SETTINGS, r.settings))
			default:
				if r.status == PLAYING {
					r.game.EnqueueEvent(e)
				}
			}
		}

	}
}

func (r *room) BroadcastExcept(msg []byte, excludePlayer Player) {
	for player, client := range r.players {
		if player.Info().ID != excludePlayer.Info().ID {
			client.Send(msg)
		}
	}
}

func (r *room) StateMsg() []byte {
	type state struct {
		Status  RoomStatus    `json:"status"`
		Players []*PlayerInfo `json:"players"`
		Code    string        `json:"code"`
		Game    *game         `json:"game"`
	}

	players := []*PlayerInfo{}
	for _, player := range r.Players() {
		players = append(players, player.Info())
	}

	msg := &state{
		Players: players,
		Code:    r.code,
		Status:  r.status,
	}

	if r.game != nil {
		msg.Game = r.game.State()
	}

	return marshalEvent(STATE, msg)
}
