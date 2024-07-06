package main

import (
	"context"
	"log/slog"
	"time"
)

type Game interface {
	Run(ctx context.Context, l Room)
	PushEvent(e *RoomEvent)
}

type Stroke struct {
	Points [][]int `json:"points"`
	Color  string  `json:"color"` // hex color
	Width  int     `json:"width"`
}

type game struct {
	strokes        []Stroke
	event          chan *RoomEvent
	scores         map[Player]int
	currentRound   int
	totalRounds    int
	roundDuration  int
	roundStartedAt time.Time
}

func NewGame() Game {
	return &game{
		event:         make(chan *RoomEvent, 5), // event buffer size of 5
		roundDuration: 15,
	}
}

func (g *game) Run(ctx context.Context, l Room) {
	slog.Info("Game routine started: ")
	roundTimer := time.NewTimer(time.Duration(g.roundDuration+7) * time.Second)
	judgeTimer := time.NewTimer(time.Duration(g.roundDuration+2) * time.Second)

	g.start(l)

	defer func() {
		slog.Info("Game routine exited")
		roundTimer.Stop()
		judgeTimer.Stop()
	}()

	for {
		select {
		case <-ctx.Done():
			return
		case e := <-g.event:
			g.handleEvent(e)
		case <-judgeTimer.C:
			slog.Info("judge timer")
		case <-roundTimer.C:
			slog.Info("round timer")

			if g.currentRound == g.totalRounds {
				g.end(l)
				return
			}

			roundTimer.Reset(time.Duration(g.roundDuration+7) * time.Second)
			judgeTimer.Reset(time.Duration(g.roundDuration+2) * time.Second)
		}
	}

}

func (g *game) start(r Room) {
	slog.Info("Game started")
}

func (g *game) end(r Room) {
	slog.Info("Game ended")
}

// func (game *game) calculateScore(a playerAnswer) int {
// 	timeTaken := (float32(game.roundDuration) - a.timeTaken) / float32(game.roundDuration)

// 	if timeTaken < 0.0 {
// 		timeTaken = 0
// 	}

// 	return int(timeTaken * 100.0)
// }

func (g *game) handleEvent(e *RoomEvent) {
	slog.Info("recv event in game routine of type %s from player %s\n", "type", e.Type, "player", e.Player.Info().ID)

	switch e.Type {
	case NEW_STROKE:
		g.strokes = append(g.strokes, e.Payload.(Stroke))
	}
}

func (g *game) PushEvent(e *RoomEvent) {
	select {
	case g.event <- e:
		slog.Info("sent event to chan in game")
	default:
		slog.Warn("dropped event in game chan")
	}

}
