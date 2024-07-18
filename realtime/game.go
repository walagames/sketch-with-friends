package main

import (
	"context"
	"encoding/json"
	"log/slog"

	"time"

	"github.com/mitchellh/mapstructure"
)

type Game interface {
	Run(ctx context.Context, r Room)
	EnqueueEvent(e *RoomEvent)
	State() *GameState
}

type GameState struct {
	Strokes []Stroke `json:"strokes"`
}

type Stroke struct {
	Points [][]int `json:"points"`
	Color  string  `json:"color"` // hex color
	Width  int     `json:"width"`
}

type game struct {
	strokes       []Stroke
	event         chan *RoomEvent
	roundDuration int
	totalRounds   int
	currentRound  int
}

func NewGame() Game {
	return &game{
		strokes:       make([]Stroke, 0),
		event:         make(chan *RoomEvent, 5), // event buffer size of 5
		roundDuration: 10,
		totalRounds:   3,
		currentRound:  1,
	}
}

func (g *game) State() *GameState {
	return &GameState{
		Strokes: g.strokes,
	}
}

func (g *game) Run(ctx context.Context, r Room) {
	slog.Info("Game routine started: ")
	roundTimer := time.NewTimer(time.Duration(g.roundDuration+7) * time.Second)
	judgeTimer := time.NewTimer(time.Duration(g.roundDuration+2) * time.Second)

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
			g.processEvent(e)
			json, err := json.Marshal(e)
			if err != nil {
				slog.Error("error marshalling event", "error", err)
			}
			r.BroadcastExcept(json, e.Player)
		case <-judgeTimer.C:
			slog.Info("judge timer")
		case <-roundTimer.C:
			slog.Info("round timer")

			if g.currentRound == g.totalRounds {
				g.end(r)
				return
			}

			roundTimer.Reset(time.Duration(g.roundDuration+7) * time.Second)
			judgeTimer.Reset(time.Duration(g.roundDuration+2) * time.Second)
		}
	}
}

func (g *game) EnqueueEvent(e *RoomEvent) {
	select {
	case g.event <- e:
	default:
		slog.Warn("game event channel full, dropping event", "event", e)
	}
}

func (g *game) processEvent(e *RoomEvent) {
	switch e.Type {
	case STROKE:
		g.startStroke(e)
	case STROKE_POINT:
		g.appendStrokePoint(e)
	case CLEAR_STROKES:
		g.clearStrokes()
	case UNDO_STROKE:
		g.undoStroke()
	default:
		slog.Warn("unhandled event", "event", e)
	}
}

func (g *game) startStroke(e *RoomEvent) {
	stroke, err := decodePayload[Stroke](e.Payload)
	if err != nil {
		slog.Warn("failed to process stroke", "error", err)
		return
	}
	g.strokes = append(g.strokes, stroke)
}

func (g *game) appendStrokePoint(e *RoomEvent) {
	point, err := decodePayload[[]int](e.Payload)
	if err != nil {
		slog.Warn("failed to process stroke point", "error", err)
		return
	}
	g.strokes[len(g.strokes)-1].Points = append(g.strokes[len(g.strokes)-1].Points, point)
}

func (g *game) clearStrokes() {
	g.strokes = make([]Stroke, 0)
}

func (g *game) undoStroke() {
	if len(g.strokes) > 0 {
		g.strokes = g.strokes[:len(g.strokes)-1]
	}
}

func decodePayload[T any](payload interface{}) (T, error) {
	var target T
	err := mapstructure.Decode(payload, &target)
	if err != nil {
		slog.Warn("failed to decode payload", "error", err)
		return target, err
	}
	return target, nil
}

func (g *game) end(r Room) {
	slog.Info("Game ended")
}
