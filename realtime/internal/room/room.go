package room

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	realtime "github.com/jacobschwantes/sketch-with-friends/realtime/internal"
)

type room struct {
	code      string
	players   map[realtime.Player]*client
	broadcast chan []byte
	connect   chan *client
	register  chan realtime.Player
	event     chan *realtime.Event
	game      realtime.Game
}

// ? tbh this really should just be a struct instead of interface
func (r *room) Player(id string) realtime.Player {
	for p := range r.players {
		if p.ID() == id {
			return p
		}
	}
	return nil
}

func (r *room) Players() []*realtime.PlayerInfo {
	playerList := []*realtime.PlayerInfo{}
	for player := range r.players {
		playerList = append(playerList, player.Info())
	}
	return playerList
}

func (r *room) Code() string {
	return r.code // * safe - it will never change
}

func (r *room) Connect(conn *websocket.Conn) error {
	userId := uuid.New().String()
	profile := realtime.PlayerProfile{
		ID:   userId,
		Name: "user1",
	}
	p := NewPlayer(profile, realtime.RoleHost)
	
	r.connect <- newClient(conn, r, p)

	return nil
}

func (r *room) Broadcast(msg []byte) {
	r.broadcast <- msg
}

func (r *room) Run(rm realtime.RoomManager) {
	fmt.Println("Room routine started: ", r.code)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	ticker := time.NewTicker(time.Second * 30)

	defer func() {
		fmt.Println("Room routine exited: ", r.code)
		rm.CloseRoom(r.code, "room routine exited")
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

			fmt.Printf("%s connected: %s\n", client.Player.Info().Role, client.Player.Info().Profile.Name)

			msg := r.state(client.Player)
			client.Send(msg)
		case msg := <-r.broadcast:
			for _, client := range r.players {
				client.Send(msg)
			}
		case e := <-r.event:
			fmt.Printf("recv event of type %s from player %s\n", e.Type, e.Player.ID())
			switch e.Type {
			case realtime.START_GAME:
				if e.Player.Role() == realtime.RoleHost {
					go r.game.Run(ctx, r)
				}
			case realtime.CLOSE_LOBBY:
				if e.Player.Role() == realtime.RoleHost {
					cancel()
				}
			case realtime.STROKE:
				fmt.Println(e.Payload)
				evt := &realtime.Event{
					Type:    realtime.STROKE,
					Payload: e.Payload,
				}

				msgBytes, err := json.Marshal(evt)
				if err != nil {
					fmt.Println("error marshalling event: ", err)
				}

				for player, client := range r.players {
					fmt.Println(player.ID(), e.Player.ID())
					if player.ID() != e.Player.ID() {
						fmt.Println("sending event to", player.ID())
						client.Send(msgBytes)
					}
				}
			default:
				r.game.PushEvent(e)
			}
		case <-ticker.C:
			for p := range r.players {
				fmt.Printf("%s: %s\n", p.Info().Role, p.Info().Profile.Name)
			}
		}

	}
}

// * opportunity for generic ? or veratic
func (r *room) state(p realtime.Player) []byte {
	type stateUpdate struct {
		Players []*realtime.PlayerInfo `json:"players"`
		Code    string                 `json:"code"`
		Role    realtime.PlayerRole    `json:"role"`
	}

	msgBytes, _ := json.Marshal(&realtime.Event{
		Type: realtime.ROOM_STATE,
		Payload: &stateUpdate{
			Players: r.Players(),
			Code:    r.code,
			Role:    p.Role(),
		},
	})

	return msgBytes
}
