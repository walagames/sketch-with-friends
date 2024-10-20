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
	MAX_LOBBIES  = 20
	CLEANUP_TICK = 1 * time.Minute  // How often to check for idle rooms
	ROOM_TIMEOUT = 20 * time.Minute // How long a room can be idle before it gets cleaned up
)

type RoomManager interface {
	Run(ctx context.Context)
	Room(id string) (Room, error)
	Register() (Room, error)
	Unregister(id string) error
}

type roomManager struct {
	rooms map[string]Room
	mu    sync.RWMutex
}

func NewRoomManager() RoomManager {
	return &roomManager{
		rooms: make(map[string]Room),
	}
}

func (rm *roomManager) Run(ctx context.Context) {
	slog.Info("Room manager started")

	cleanupTicker := time.NewTicker(CLEANUP_TICK)
	defer cleanupTicker.Stop()

	defer func() {
		slog.Info("Room manager exited")
	}()
	for {
		select {
		case <-ctx.Done():
			return
		case <-cleanupTicker.C:
			rm.cleanup()
		}
	}
}

func (rm *roomManager) cleanup() {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	for id, room := range rm.rooms {
		if time.Since(room.LastInteractionAt()) > ROOM_TIMEOUT {
			slog.Info("Closing idle room", "id", id, "idle_time", time.Since(room.LastInteractionAt()).Round(time.Second).String())
			room.Close(ErrRoomIdle)
		}
	}
}

func (rm *roomManager) Register() (Room, error) {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	if len(rm.rooms) >= MAX_LOBBIES {
		slog.Warn("maximum number of rooms reached, cannot create a new room")
		return nil, fmt.Errorf("maximum number of rooms reached")
	}

	id, err := rm.uniqueRoomID()
	if err != nil {
		return nil, err
	}

	room := NewRoom(id)
	rm.rooms[id] = room

	return room, nil
}

func (rm *roomManager) Unregister(id string) error {
	if _, err := rm.Room(id); err == nil {
		rm.mu.Lock()
		defer rm.mu.Unlock()
		delete(rm.rooms, id)
		slog.Info("Room deleted", "id", id)
		return nil
	}

	slog.Warn("tried to delete a room that does not exist", "id", id)
	return fmt.Errorf("room with id:%s not found", id)
}

func (rm *roomManager) Room(id string) (Room, error) {
	rm.mu.RLock()
	defer rm.mu.RUnlock()
	if room, ok := rm.rooms[id]; ok {
		return room, nil
	}
	slog.Warn("tried to get a room that does not exist", "id", id)
	return nil, fmt.Errorf("room not found")
}

func (rm *roomManager) uniqueRoomID() (string, error) {
	id, err := randomID(6)
	if err != nil {
		return "", err
	}

	if _, ok := rm.rooms[id]; ok {
		slog.Warn("Room code already exists, retrying", "code", id)
		return rm.uniqueRoomID()
	}

	return id, nil
}

func randomID(length int) (string, error) {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		// This should never happen
		return "", err
	}
	for i := 0; i < length; i++ {
		b[i] = charset[b[i]%byte(len(charset))]
	}
	return string(b), nil
}
