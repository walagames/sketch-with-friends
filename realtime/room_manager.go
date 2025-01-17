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
	// Maximum number of rooms that can be created
	MAX_ROOMS = 20

	// How often to check for idle rooms
	ROOM_TICK = 1 * time.Minute

	// How long a room can be idle before it gets cleaned up
	ROOM_TIMEOUT = 20 * time.Minute
)

// RoomManager is responsible for managing the lifecycle of rooms.
// It handles room creation, deletion, and provides access to individual rooms.
//
// The RoomManager acts as a central coordinator for all active game rooms,
// ensuring that:
// 1. Rooms are created with unique identifiers
// 2. The total number of active rooms doesn't exceed a specified limit
// 3. Idle rooms are cleaned up to free resources
// 4. Clients can easily find and join existing rooms
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

// Run starts the room manager and handles the cleanup of idle rooms.
// This gets launched as a goroutine at server startup.
func (rm *roomManager) Run(ctx context.Context) {
	slog.Info("Room manager started")

	// This ticker will be used to periodically check for idle rooms and clean them up.
	ticker := time.NewTicker(ROOM_TICK)
	defer ticker.Stop()

	defer func() {
		slog.Info("Room manager shutting down")
	}()
	for {
		select {
		case <-ctx.Done():
			return
		}
	}
}

// Creates a new room and adds it to the registry.
func (rm *roomManager) Register() (Room, error) {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	if len(rm.rooms) >= MAX_ROOMS {
		slog.Warn("maximum number of rooms reached, cannot create a new room")
		return nil, fmt.Errorf("maximum number of rooms reached")
	}

	// Generate a unique room ID
	id, err := rm.uniqueRoomID()
	if err != nil {
		slog.Error("failed to generate a unique room ID", "error", err)
		return nil, err
	}

	// Create and store the room
	room := NewRoom(id)
	rm.rooms[id] = room

	return room, nil
}

// Removes a room from the registry.
// This is called with the assumption that the room routine has already exited.
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

// Returns a room by its ID.
// Used in /join/:id route handler to fetch the room for the player to join.
func (rm *roomManager) Room(id string) (Room, error) {
	rm.mu.RLock()
	defer rm.mu.RUnlock()
	if room, ok := rm.rooms[id]; ok {
		return room, nil
	}
	slog.Warn("tried to get a room that does not exist", "id", id)
	return nil, fmt.Errorf("room not found")
}

// Generates a unique room ID.
// If there is a collision, it retries until it finds a unique ID.
func (rm *roomManager) uniqueRoomID() (string, error) {
	id, err := randomID(4)
	if err != nil {
		slog.Error("failed to generate a unique room ID", "error", err)
		return "", err
	}

	if _, ok := rm.rooms[id]; ok {
		slog.Warn("room code already exists, retrying", "code", id)
		return rm.uniqueRoomID()
	}

	return id, nil
}

// Generates a random ID string of a given length.
func randomID(length int) (string, error) {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ"
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
