package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"

	realtime "github.com/jacobschwantes/sketch-with-friends/realtime/internal"
	"github.com/jacobschwantes/sketch-with-friends/realtime/internal/http"
	"github.com/jacobschwantes/sketch-with-friends/realtime/internal/room"
	"github.com/joho/godotenv"
)

func run(ctx context.Context) error {

	if env := os.Getenv("ENVIRONMENT"); env == "development" {
		if err := godotenv.Load(); err != nil {
			log.Printf("Error loading .env file: %v", err)
		}
	}

	ctx, cancel := signal.NotifyContext(ctx, os.Interrupt)
	defer cancel()

	cfg := &realtime.HTTPConfig{
		Host: os.Getenv("HOST"),
		Port: os.Getenv("PORT"),
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
