package realtime

import "github.com/gorilla/websocket"

type Room interface {
	Player(userID string) Player
	Players() []*PlayerInfo
	Code() string
	Connect(conn *websocket.Conn) error
	Run(rm RoomManager)
	Broadcast(msg []byte)
}

type RoomState struct {
	Code     string        `json:"code,omitempty"`
	Players  []Player      `json:"players,omitempty"`
	State    *GameState    `json:"state,omitempty"`
	Settings *GameSettings `json:"settings,omitempty"`
}

type RoomManager interface {
	Room(code string) (Room, error)
	CreateRoom() (Room, string, error)
	CloseRoom(code string, message string) error
}

type RoomEventType string

// Server emitted events
const (
	ROOM_STATE RoomEventType = "ROOM_STATE"
	STROKE     RoomEventType = "STROKE"
	MESSAGE    RoomEventType = "MESSAGE"
)

// User emitted events
const (
	START_GAME  RoomEventType = "START_GAME"
	CLOSE_LOBBY RoomEventType = "CLOSE_LOBBY"
)

type Event struct {
	Type    RoomEventType `json:"type"`
	Payload interface{}   `json:"payload"`
	Player  Player
}

type RoomSettings struct {
	Name         string       `json:"name,omitempty"`
	Code         string       `json:"code,omitempty"`
	Private      bool         `json:"private,omitempty"`
	MaxPlayers   int          `json:"maxPlayers,omitempty"`
	GameSettings GameSettings `json:"gameSettings,omitempty"`
}
