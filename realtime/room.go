package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/gorilla/websocket"
)

type Room interface {
	Player(userID string) Player
	Players() []*PlayerInfo
	Close()
	Connect(conn *websocket.Conn, role PlayerRole, name string) error
	Run(rm RoomManager)
	Broadcast(msg []byte)
}

type RoomState struct {
	Code    string   `json:"code,omitempty"`
	Players []Player `json:"players,omitempty"`
	Strokes []Stroke `json:"strokes,omitempty"`
}


type RoomEventType string

const (
	INITIAL_STATE RoomEventType = "INITIAL_STATE"
	NEW_STROKE    RoomEventType = "NEW_STROKE"
	STROKE_POINT  RoomEventType = "STROKE_POINT"
)

type RoomEvent struct {
	Type    RoomEventType `json:"type"`
	Payload interface{}   `json:"payload"`
	Player  Player
}

type room struct {
	code      string
	players   map[Player]*client
	broadcast chan []byte
	connect   chan *client
	disconnect chan *client
	event     chan *RoomEvent
	game      Game
	cancel    context.CancelFunc
}

func NewRoom(code string) Room {
	return &room{
		code:      code,
		players:   make(map[Player]*client),
		broadcast: make(chan []byte),
		connect:   make(chan *client),
		disconnect: make(chan *client),
		event:     make(chan *RoomEvent),
	}
}

// ? tbh this really should just be a struct instead of interface
func (r *room) Player(id string) Player {
	for p := range r.players {
		if p.Info().ID == id {
			return p
		}
	}
	return nil
}

func (r *room) Players() []*PlayerInfo {
	playerList := []*PlayerInfo{}
	for player := range r.players {
		playerList = append(playerList, player.Info())
	}
	return playerList
}

func (r *room) Connect(conn *websocket.Conn, role PlayerRole, name string) error {
	p := NewPlayer(role, name)
	r.connect <- newClient(conn, r, p)

	return nil
}

func (r *room) Disconnect(p Player) {
	r.disconnect <- r.players[p]
}

func (r *room) Broadcast(msg []byte) {
	r.broadcast <- msg
}


func (r *room) Close() {
	r.cancel()
}

func (r *room) Run(rm RoomManager) {
	slog.Info("Room routine started", "code", r.code)
	ctx, cancel := context.WithCancel(context.Background())
	r.cancel = cancel
	defer cancel()
	ticker := time.NewTicker(time.Second * 30)

	defer func() {
		slog.Info("Room routine exited", "code", r.code)
		rm.ShutdownRoom(r.code, "Room closed")
	}()
	for {
		select {
		case <-ctx.Done():
			for _, c := range r.players {
				c.Close()
			}
			return
		case client := <-r.connect:
			client.Run(ctx)
			r.players[client.Player] = client

			slog.Info("player connected", "player", client.Player.Info().ID)

			msg := r.state(client.Player)
			client.Send(msg)
		case client := <-r.disconnect:
			delete(r.players, client.Player)
			if len(r.players) == 0 {
				r.cancel()
			}
		case msg := <-r.broadcast:
			for _, client := range r.players {
				client.Send(msg)
			}
		case e := <-r.event:
			slog.Info("recv event", "type", e.Type, "player", e.Player.Info().ID)
			switch e.Type {
			// case realtime.START_GAME:
			// 	if e.Player.Role() == realtime.RoleHost {
			// 		go r.game.Run(ctx, r)
			// 	}
			// case realtime.CLOSE_LOBBY:
			// 	if e.Player.Role() == realtime.RoleHost {
			// 		cancel()
			// 	}
			case NEW_STROKE:
				evt := &RoomEvent{
					Type:    NEW_STROKE,
					Payload: e.Payload,
				}

				msgBytes, err := json.Marshal(evt)
				if err != nil {
					slog.Error("error marshalling event", "error", err)
				}

				for player, client := range r.players {
					if player.Info().ID != e.Player.Info().ID {
						slog.Info("sending event to", "player", player.Info().ID)
						client.Send(msgBytes)
					}
				}
			default:
				// r.game.PushEvent(e)
			}
		case <-ticker.C:
			// for p := range r.players {
			// 	slog.Info("player", "player", p.Info().ID)
			// }
		}

	}
}

// * opportunity for generic ? or veratic
func (r *room) state(p Player) []byte {
	type stateUpdate struct {
		Players []*PlayerInfo `json:"players"`
		Code    string                 `json:"code"`
		Strokes []*Stroke    `json:"strokes"`
	}

	msgBytes, _ := json.Marshal(&RoomEvent{
		Type: INITIAL_STATE,
		Payload: &stateUpdate{
			Players: r.Players(),
			Code:    r.code,
			Strokes: []*Stroke{},
		},
	})

	return msgBytes
}
