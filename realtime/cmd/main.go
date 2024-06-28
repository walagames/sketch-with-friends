package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"

	realtime "github.com/jacobschwantes/sketch-with-friends/realtime/internal"
	"github.com/jacobschwantes/sketch-with-friends/realtime/internal/http"
	"github.com/jacobschwantes/sketch-with-friends/realtime/internal/room"
	"github.com/joho/godotenv"
)

func run(ctx context.Context) error {
	err := godotenv.Load()
	if err != nil {
		return err
	}
	ctx, cancel := signal.NotifyContext(ctx, os.Interrupt)
	defer cancel()

	cfg := &realtime.HTTPConfig{
		Host:        os.Getenv("HOST"),
		Port:        os.Getenv("PORT"),
		APIEndpoint: os.Getenv("API_ENDPOINT"),
		APIKey:      os.Getenv("API_KEY"),
		// AllowedOrigin: os.Getenv("CORS_ALLOWED_ORIGINS"),
	}
	rm := room.NewManager()

	http.ServeHTTP(ctx, cfg, rm)
	return nil
}

func main() {
	ctx := context.Background()
	if err := run(ctx); err != nil {
		fmt.Fprintf(os.Stderr, "error running realtime server: %s\n", err)
		os.Exit(1)
	}
}
