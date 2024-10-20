package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"strconv"

	"github.com/lmittmann/tint"
)

func init() {
	w := os.Stderr

	logLevel := slog.LevelDebug

	if env := os.Getenv("LOGGER"); env != "" {
		level, err := strconv.Atoi(env)
		if err != nil {
			slog.Warn("invalid LOGGER env, defaulting", "level", logLevel, "error", err)
		} else {
			slog.Info("setting logger", "level", slog.Level(level))
			logLevel = slog.Level(level)
		}
	}

	// set global logger with custom options
	slog.SetDefault(slog.New(
		tint.NewHandler(w, &tint.Options{
			Level:      logLevel,
			TimeFormat: "2006-01-02 15:04:05",
		}),
	))
}

func run(ctx context.Context) error {
	slog.Info("Realtime server starting up")
	ctx, cancel := signal.NotifyContext(ctx, os.Interrupt)
	defer cancel()

	port := os.Getenv("PORT")
	host := os.Getenv("HOST")

	if port == "" {
		slog.Warn("PORT env not set, defaulting to 8080")
		port = "8080"
	}
	if host == "" {
		slog.Warn("HOST env not set, defaulting to localhost")
		host = "localhost"
	}

	cfg := &HTTPConfig{
		Host: host,
		Port: port,
	}
	rm := NewRoomManager()
	go rm.Run(ctx)

	ServeHTTP(ctx, cfg, rm)
	return nil
}

func main() {
	ctx := context.Background()
	if err := run(ctx); err != nil {
		slog.Error("error running realtime server", "error", err)
		os.Exit(1)
	}
}
