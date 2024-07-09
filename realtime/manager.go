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
			rm.mu.Lock()
			playerCount := 0
			for _, room := range rm.rooms {
				playerCount += len(room.Players())
			}
			rm.mu.Unlock()
			var m runtime.MemStats
			runtime.ReadMemStats(&m)
			slog.Debug("System metrics",
				"goroutines", runtime.NumGoroutine(),
				"total_alloc_mib", formatBytes(m.TotalAlloc),
				"heap_alloc_mib", formatBytes(m.HeapAlloc),
				"stack_inuse_mib", formatBytes(m.StackInuse),
				"heap_released_mib", formatBytes(m.HeapReleased),
				"heap_inuse_mib", formatBytes(m.HeapInuse),
				"heap_idle_mib", formatBytes(m.HeapIdle),
				"heap_objects", m.HeapObjects,
				"player_count", playerCount,
				"rooms", len(rm.rooms),
			)
		}
	}
}

func formatBytes(b uint64) uint64 {
	return b / 1024 / 1024
}

func (rm *roomManager) CreateRoom() (Room, error) {
	code, err := rm.uniqueRoomCode()
	if err != nil {
		return nil, err
	}

	room := NewRoom(code)
	rm.mu.Lock()
	rm.rooms[code] = room
	rm.mu.Unlock()

	return room, nil
}

func (rm *roomManager) ShutdownRoom(code string, message string) error {
	if _, err := rm.Room(code); err == nil {
		rm.mu.Lock()
		delete(rm.rooms, code)
		rm.mu.Unlock()
		slog.Info("Room deleted", "code", code, "message", message)
		return nil
	}

	slog.Warn("tried to shutdown a room that does not exist", "code", code)
	return fmt.Errorf("room with code:%s not found", code)
}

func (rm *roomManager) Room(code string) (Room, error) {
	rm.mu.Lock()
	defer rm.mu.Unlock()
	if room, ok := rm.rooms[code]; ok {
		return room, nil
	}
	slog.Warn("tried to get a room that does not exist", "code", code)
	return nil, fmt.Errorf("room not found")
}

func (rm *roomManager) uniqueRoomCode() (string, error) {
	rm.mu.Lock()
	defer rm.mu.Unlock()
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
