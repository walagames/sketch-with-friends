package main

import (
	"context"
	"encoding/json"
	"log/slog"

	"github.com/mitchellh/mapstructure"
	// "time"
)

type GameState struct {
	Strokes []Stroke `json:"strokes"`
}

type Game interface {
	Run(ctx context.Context, r Room)
	PushEvent(e *RoomEvent)
	State() *GameState
}

type Stroke struct {
	Points [][]int `json:"points"`
	Color  string  `json:"color"` // hex color
	Width  int     `json:"width"`
}

type game struct {
	strokes        []Stroke
	event          chan *RoomEvent
}

func NewGame() Game {
	return &game{
		strokes:       make([]Stroke, 0),
		event:         make(chan *RoomEvent, 5), // event buffer size of 5
	}
}

func (g *game) State() *GameState {
	return &GameState{
		Strokes: g.strokes,
	}
}

func (g *game) Run(ctx context.Context, r Room) {
	slog.Info("Game routine started: ")
	// roundTimer := time.NewTimer(time.Duration(g.roundDuration+7) * time.Second)
	// judgeTimer := time.NewTimer(time.Duration(g.roundDuration+2) * time.Second)


	defer func() {
		slog.Info("Game routine exited")
		// roundTimer.Stop()
		// judgeTimer.Stop()
	}()

	for {
		select {
		case <-ctx.Done():
			return
		case e := <-g.event:
			g.handleEvent(e)
			json, err := json.Marshal(e)
			if err != nil {
				slog.Error("error marshalling event", "error", err)
			}
			r.BroadcastExcept(json, e.Player)
		// case <-judgeTimer.C:
		// 	slog.Info("judge timer")
		// case <-roundTimer.C:
		// 	slog.Info("round timer")

		// 	if g.currentRound == g.totalRounds {
		// 		g.end(l)
		// 		return
		// 	}

		// 	roundTimer.Reset(time.Duration(g.roundDuration+7) * time.Second)
		// 	judgeTimer.Reset(time.Duration(g.roundDuration+2) * time.Second)
		}
	}

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

	// slog.Info("recv event in game routine of type %s from player %s\n", "type", e.Type, "player", e.Player.Info().ID)
	switch e.Type {
	case NEW_STROKE:
		var stroke Stroke
		err := mapstructure.Decode(e.Payload, &stroke)
		if err != nil {
			slog.Warn("unhandled event in game", "event", e)
			return
		}
		g.strokes = append(g.strokes, stroke)
	case STROKE_POINT:
		var point []int
		err := mapstructure.Decode(e.Payload, &point)
		if err != nil {
			slog.Warn("unhandled event in game", "event", e)
			return
		}
		g.strokes[len(g.strokes)-1].Points = append(g.strokes[len(g.strokes)-1].Points, point)
	default:
		slog.Warn("unhandled event in game", "event", e)
	}
}

func (g *game) PushEvent(e *RoomEvent) {
	select {
	case g.event <- e:
	default:
		slog.Warn("dropped event in game chan")
	}

}


