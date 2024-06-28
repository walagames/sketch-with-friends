package room

import (
	"crypto/rand"
	"fmt"
	"time"

	realtime "github.com/jacobschwantes/sketch-with-friends/realtime/internal"
)

// !!! Need to add lock to map operations
const (
	MAX_LOBBIES      = 20
	LOBBY_TIMEOUT    = 15 * time.Minute
	CLEANUP_INTERVAL = 5 * time.Minute
)

type roomManager struct {
	lobbies map[string]*room
}

func NewManager() realtime.RoomManager {
	return &roomManager{
		lobbies: make(map[string]*room),
	}
}

func (rm *roomManager) CreateRoom() (realtime.Room, string, error) {
	code, err := rm.uniqueRoomCode()
	if err != nil {
		return nil, "", err
	}

	room := &room{
		code:       code,
		players:    make(map[realtime.Player]*client),
		connect:    make(chan *client),
		broadcast:  make(chan []byte),
		register:   make(chan realtime.Player),
		event:      make(chan *realtime.Event),
	}
	rm.lobbies[code] = room

	return room, code, nil
}

func (rm *roomManager) CloseRoom(code string, message string) error {
	if _, err := rm.Room(code); err == nil {
		delete(rm.lobbies, code)
		fmt.Printf("Room %s deleted: %s\n", code, message)
		return nil
	}

	return fmt.Errorf("room with code:%s not found", code)
}

func (rm *roomManager) Room(code string) (realtime.Room, error) {
	if room, ok := rm.lobbies[code]; ok {
		return room, nil
	}
	return nil, fmt.Errorf("room not found")
}

func (rm *roomManager) uniqueRoomCode() (string, error) {
	code, err := generateRandomCode(4)
	if err != nil {
		return "", err
	}
	
	if _, ok := rm.lobbies[code]; ok {
		return rm.uniqueRoomCode()
	}

	return code, nil
}

func generateRandomCode(length int) (string, error) {
	const charset = "ABCDEFGHIJKLNPQRSTUVWXYZ"
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	for i := 0; i < length; i++ {
		b[i] = charset[b[i]%byte(len(charset))]
	}
	return string(b), nil
}
