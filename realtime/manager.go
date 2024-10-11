package main

import (
	"context"
	"crypto/rand"
	"fmt"
	"log/slog"
	"sync"
	"time"
)

const (
	MAX_LOBBIES   = 20
	LOBBY_TIMEOUT = 15 * time.Minute
)

type RoomManager interface {
	Run(ctx context.Context)
	Room(id string) (Room, error)
	Register() (Room, error)
	Unregister(id string) error
}

type roomManager struct {
	rooms map[string]Room
	mu    sync.Mutex
}

func NewRoomManager() RoomManager {
	return &roomManager{
		rooms: make(map[string]Room),
	}
}

func (rm *roomManager) Run(ctx context.Context) {
	slog.Info("Room manager started")

	defer func() {
		slog.Info("Room manager exited")
	}()
	for {
		select {
		case <-ctx.Done():
			return
		}
	}
}

func (rm *roomManager) Register() (Room, error) {
	rm.mu.Lock()
	if len(rm.rooms) >= MAX_LOBBIES {
		rm.mu.Unlock()
		slog.Warn("maximum number of rooms reached, cannot create a new room")
		return nil, fmt.Errorf("maximum number of rooms reached")
	}

	id := rm.uniqueRoomID()
	room := NewRoom(id)

	rm.rooms[id] = room
	rm.mu.Unlock()

	return room, nil
}

func (rm *roomManager) Unregister(id string) error {
	if _, err := rm.Room(id); err == nil {
		rm.mu.Lock()
		delete(rm.rooms, id)
		rm.mu.Unlock()
		slog.Info("Room deleted", "id", id)
		return nil
	}

	slog.Warn("tried to delete a room that does not exist", "id", id)
	return fmt.Errorf("room with id:%s not found", id)
}

func (rm *roomManager) Room(id string) (Room, error) {
	rm.mu.Lock()
	defer rm.mu.Unlock()
	if room, ok := rm.rooms[id]; ok {
		return room, nil
	}
	slog.Warn("tried to get a room that does not exist", "id", id)
	return nil, fmt.Errorf("room not found")
}

func (rm *roomManager) uniqueRoomID() string {
	id := randomID(6)

	if _, ok := rm.rooms[id]; ok {
		slog.Warn("Room code already exists", "code", id)
		return randomID(6)
	}

	return id
}

func randomID(length int) string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		// This should never happen; if it does, there is a critical system error
		panic(err)
	}
	for i := 0; i < length; i++ {
		b[i] = charset[b[i]%byte(len(charset))]
	}
	return string(b)
}
