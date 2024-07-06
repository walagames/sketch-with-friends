package main

import (
	"context"
	"crypto/rand"
	"fmt"
	"log/slog"
	"runtime"
	"sync"
	"time"
)

// !!! Need to add lock to map operations
const (
	MAX_LOBBIES        = 20
	LOBBY_TIMEOUT      = 15 * time.Minute
	REPORTING_INTERVAL = 20 * time.Second
)

type RoomManager interface {
	Run(ctx context.Context)
	Room(code string) (Room, error)
	CreateRoom() (Room, error)
	ShutdownRoom(code string, message string) error
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
	slog.Info("Starting room manager")
	ticker := time.NewTicker(REPORTING_INTERVAL)
	defer ticker.Stop()

	defer func() {
		slog.Info("Shutting down room manager")
	}()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			slog.Info("Reporting rooms", "rooms", len(rm.rooms))
			slog.Info("Goroutines", "goroutines", runtime.NumGoroutine())
		}

	}
}

func (rm *roomManager) CreateRoom() (Room, error) {
	code, err := rm.uniqueRoomCode()
	if err != nil {
		return nil, err
	}

	room := NewRoom(code)
	rm.rooms[code] = room

	return room, nil
}

func (rm *roomManager) ShutdownRoom(code string, message string) error {
	if _, err := rm.Room(code); err == nil {
		delete(rm.rooms, code)
		slog.Info("Room deleted", "code", code, "message", message)
		return nil
	}

	slog.Warn("tried to shutdown a room that does not exist", "code", code)
	return fmt.Errorf("room with code:%s not found", code)
}

func (rm *roomManager) Room(code string) (Room, error) {
	if room, ok := rm.rooms[code]; ok {
		return room, nil
	}
	slog.Warn("tried to get a room that does not exist", "code", code)
	return nil, fmt.Errorf("room not found")
}

func (rm *roomManager) uniqueRoomCode() (string, error) {
	code, err := generateRandomCode(4)
	if err != nil {
		return "", err
	}

	if _, ok := rm.rooms[code]; ok {
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
