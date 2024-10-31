package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

type contextKey string

const requestIDKey contextKey = "requestID"

// Adds a request ID to the context and response headers
// This is useful for grouping logs together by the same request
func requestIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := uuid.New().String()
		ctx := context.WithValue(r.Context(), requestIDKey, requestID)
		w.Header().Set("X-Request-ID", requestID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Gets the request ID from the context
func getRequestID(ctx context.Context) string {
	if requestID, ok := ctx.Value(requestIDKey).(string); ok {
		return requestID
	}
	return "unknown"
}

// Logs basic information about each HTTP request
func logMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		requestID, _ := r.Context().Value(requestIDKey).(string)

		next.ServeHTTP(w, r)

		if !strings.HasPrefix(r.RemoteAddr, "[::1]") {
			slog.Info("Request",
				"method", r.Method,
				"path", r.URL.Path,
				"remote_addr", r.RemoteAddr,
				"user_agent", r.UserAgent(),
				"duration", time.Since(start),
				"request_id", requestID,
			)
		}
	})
}

// Extracts the username, avatarSeed, and avatarColor from the request.
// We use this info to create a new player.
func extractUserParams(r *http.Request) (string, string, string, error) {
	username := r.URL.Query().Get("username")
	avatarSeed := r.URL.Query().Get("avatarSeed")
	avatarColor := r.URL.Query().Get("avatarColor")

	if username == "" || avatarSeed == "" || avatarColor == "" {
		return "", "", "", errors.New("missing required query parameters")
	}

	return username, avatarSeed, avatarColor, nil
}

// Clients use this endpoint to create and join a new room.
func host(rm RoomManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		requestID := getRequestID(r.Context())
		username, avatarSeed, avatarColor, err := extractUserParams(r)
		if err != nil {
			slog.Warn("error extracting user params",
				"error", err,
				"query", r.URL.Query().Encode(),
				"request_id", requestID,
			)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Upgrade the HTTP connection to a WebSocket connection
		conn, err := UpgradeConnection(w, r)
		if err != nil {
			slog.Warn("Failed to upgrade to websocket connection",
				"error", err,
				"request_id", requestID,
			)
			http.Error(w, "Failed to upgrade to websocket connection", http.StatusInternalServerError)
			return
		}

		// Register a new room
		room, err := rm.Register()
		if err != nil {
			slog.Warn("Failed to register room",
				"error", err,
				"request_id", requestID,
			)
			http.Error(w, "Failed to create room", http.StatusInternalServerError)
			return
		}
		// Start the room as a background process
		go room.Run(rm)

		// Connect the player to the newly created room
		player := NewPlayer(&playerOptions{
			roomRole:    RoomRoleHost,
			name:        username,
			avatarSeed:  avatarSeed,
			avatarColor: avatarColor,
		})
		err = room.Connect(conn, player)
		if err != nil {
			slog.Warn("Failed to connect player to room",
				"roomId", room.Code(),
				"playerId", player.ID,
				"error", err,
				"request_id", requestID,
			)
			CloseConnectionWithReason(conn, err.Error())
			return
		}
		slog.Info("Player connected to room",
			"roomId", room.Code(),
			"playerId", player.ID,
			"request_id", requestID,
		)
	}
}

// Clients use this endpoint to join an existing room.
func join(rm RoomManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		requestID := getRequestID(r.Context())
		username, avatarSeed, avatarColor, err := extractUserParams(r)
		if err != nil {
			slog.Warn("Invalid query parameters",
				"error", err,
				"query", r.URL.Query().Encode(),
				"request_id", requestID,
			)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Get the room code from the URL path
		code := r.PathValue("code")
		if code == "" {
			http.Error(w, "Room code is required", http.StatusBadRequest)
			return
		}

		// Upgrade the HTTP connection to a WebSocket connection
		conn, err := UpgradeConnection(w, r)
		if err != nil {
			slog.Warn("Failed to upgrade to websocket connection",
				"error", err,
				"request_id", requestID,
			)
			http.Error(w, "Failed to upgrade to websocket connection", http.StatusInternalServerError)
			return
		}

		// Check if the room exists
		room, err := rm.Room(code)
		if err != nil {
			slog.Warn("Failed to get room",
				"roomId", code,
				"error", err,
				"request_id", requestID,
			)
			CloseConnectionWithReason(conn, ErrRoomNotFound.Error())
			return
		}

		// Connect the player to the room
		player := NewPlayer(&playerOptions{
			roomRole:    RoomRolePlayer,
			name:        username,
			avatarSeed:  avatarSeed,
			avatarColor: avatarColor,
		})
		err = room.Connect(conn, player)
		if err != nil {
			slog.Warn("Failed to connect player to room",
				"roomId", room.Code(),
				"playerId", player.ID,
				"error", err,
				"request_id", requestID,
			)
			CloseConnectionWithReason(conn, err.Error())
			return
		}
		slog.Info("Player connected to room",
			"roomId", room.Code(),
			"playerId", player.ID,
			"request_id", requestID,
		)
	}
}

type HTTPConfig struct {
	Host string
	Port string
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
	var handler http.Handler = requestIDMiddleware(logMiddleware(mux))
	return &handler
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
