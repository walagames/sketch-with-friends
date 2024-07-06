// Package main provides the entry point and core functionality for the realtime server.
// It includes HTTP server setup, routing, and WebSocket handling for real-time communication.
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"

	"sync"
	"time"

	"github.com/lmittmann/tint"
)

func init() {
	w := os.Stderr

	// set global logger with custom options
	slog.SetDefault(slog.New(
		tint.NewHandler(w, &tint.Options{
			Level:      slog.LevelDebug,
			TimeFormat: time.Kitchen,
		}),
	))
}

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
		// name := r.Header.Get("X-Player-Name")
		// if name == "" {
		// 	http.Error(w, "Name is required", http.StatusBadRequest)
		// 	return
		// }
		slog.Info("host request", "remote", r.RemoteAddr)

		// Upgrade the HTTP connection to a WebSocket connection
		conn, err := UpgradeConnection(w, r)
		if err != nil {
			slog.Error("failed to upgrade to websocket connection", "error", err)
			http.Error(w, "Failed to upgrade to websocket connection", http.StatusInternalServerError)
			return
		}

		// Create a new room
		room, err := rm.CreateRoom()
		if err != nil {
			slog.Error("failed to create room", "error", err)
			http.Error(w, "Failed to create room", http.StatusInternalServerError)
			return
		}

		go room.Run(rm)

		// Connect the client to the room
		room.Connect(conn, RoleHost, "hostUser")
	}
}

// join handles the HTTP request for joining an existing room
func join(rm RoomManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// name := r.Header.Get("X-Player-Name")
		// if name == "" {
		// 	http.Error(w, "Name is required", http.StatusBadRequest)
		// 	return
		// }
		// Get the room code from the URL path
		code := r.PathValue("code")
		if code == "" {
			http.Error(w, "Room code is required", http.StatusBadRequest)
			return
		}

		// Lookup the room using the provided code
		room, err := rm.Room(code)
		if err != nil {
			http.Error(w, "Room lookup failed", http.StatusInternalServerError)
			return
		}

		// Upgrade the HTTP connection to a WebSocket connection
		conn, err := UpgradeConnection(w, r)
		if err != nil {
			http.Error(w, "Failed to upgrade to websocket connection", http.StatusInternalServerError)
			return
		}

		// Connect the client to the room
		room.Connect(conn, RolePlayer, "playerUser")
	}
}
