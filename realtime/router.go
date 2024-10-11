package main

import (
	"context"
	"log/slog"
	"net/http"

	"errors"
	"sync"
	"time"
)

type HTTPConfig struct {
	Host string
	Port string
}

func ServeHTTP(
	ctx context.Context,
	cfg *HTTPConfig,
	rm RoomManager,
) error {
	srv := NewServer(rm, cfg)

	httpServer := &http.Server{
		Addr:    cfg.Host + ":" + cfg.Port,
		Handler: *srv,
	}

	go func() {
		slog.Info("listening on " + httpServer.Addr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("error listening and serving", "error", err)
		}
	}()
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
		defer cancel()
		if err := httpServer.Shutdown(shutdownCtx); err != nil {
			slog.Error("error shutting down http server", "error", err)
		}
		slog.Info("realtime server shut down")
	}()
	wg.Wait()
	return nil
}

func NewServer(
	rm RoomManager,
	cfg *HTTPConfig,
) *http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	mux.Handle("/host", host(rm))
	mux.Handle("/join/{code}", join(rm))

	var handler http.Handler = mux
	return &handler
}

// host handles the HTTP request for creating and joining a new room
func host(rm RoomManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get username, avatarSeed, and avatarColor from query params
		username, avatarSeed, avatarColor, err := extractUserParams(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Upgrade the HTTP connection to a WebSocket connection
		conn, err := UpgradeConnection(w, r)
		if err != nil {
			slog.Error("failed to upgrade to websocket connection", "error", err)
			http.Error(w, "Failed to upgrade to websocket connection", http.StatusInternalServerError)
			return
		}

		// Register a new room
		room, err := rm.Register()
		if err != nil {
			slog.Error("failed to create room", "error", err)
			http.Error(w, "Failed to create room", http.StatusInternalServerError)
			return
		}

		// Start the room routine
		go room.Run(rm)

		// Connect the player to the room
		player := NewPlayer(&playerOptions{
			roomRole:    RoomRoleHost,
			name:        username,
			avatarSeed:  avatarSeed,
			avatarColor: avatarColor,
		})
		room.Connect(conn, player)
	}
}

// join handles the HTTP request for joining an existing room
func join(rm RoomManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get username, avatarSeed, and avatarColor from query params
		username, avatarSeed, avatarColor, err := extractUserParams(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Get the room code from the URL path
		code := r.PathValue("code")
		if code == "" {
			slog.Error("room code is required", "remote", r.RemoteAddr)
			http.Error(w, "Room code is required", http.StatusBadRequest)
			return
		}

		// Upgrade the HTTP connection to a WebSocket connection
		conn, err := UpgradeConnection(w, r)
		if err != nil {
			slog.Error("failed to upgrade to websocket connection", "error", err)
			http.Error(w, "Failed to upgrade to websocket connection", http.StatusInternalServerError)
			return
		}

		// Lookup the room using the provided code
		room, err := rm.Room(code)
		if err != nil {
			slog.Error("failed to lookup room", "error", err)
			CloseConnectionWithReason(conn, ErrRoomNotFound.Error())
			return
		}

		// Create a new player
		player := NewPlayer(&playerOptions{
			roomRole:    RoomRolePlayer,
			name:        username,
			avatarSeed:  avatarSeed,
			avatarColor: avatarColor,
		})

		// Connect the player to the room
		err = room.Connect(conn, player)
		if err != nil {
			slog.Error("failed to connect to room", "error", err)
			CloseConnectionWithReason(conn, err.Error())
			return
		}
	}
}

func extractUserParams(r *http.Request) (string, string, string, error) {
	username := r.URL.Query().Get("username")
	avatarSeed := r.URL.Query().Get("avatarSeed")
	avatarColor := r.URL.Query().Get("avatarColor")

	slog.Info("join request",
		"remote", r.RemoteAddr,
		"username", username,
		"avatarSeed", avatarSeed,
		"avatarColor", avatarColor,
	)

	if username == "" || avatarSeed == "" || avatarColor == "" {
		slog.Error("missing required query parameters", "username", username, "avatarSeed", avatarSeed, "avatarColor", avatarColor)
		return "", "", "", errors.New("missing required query parameters")
	}

	return username, avatarSeed, avatarColor, nil
}
