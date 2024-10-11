package main

import (
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
)

type GamePhase string

type gameState struct {
	room         *room
	currentPhase Phase

	currentRound int
	drawingQueue []uuid.UUID
	wordOptions  []string

	strokes              []Stroke
	currentDrawer        *player
	currentWord          string
	currentPhaseDeadline time.Time
	isCountdownActive    bool
}

func NewGameState(initialPhase Phase, r *room) *gameState {
	return &gameState{
		room:              r,
		currentPhase:      initialPhase,
		currentRound:      1,
		drawingQueue:      make([]uuid.UUID, 0),
		wordOptions:       make([]string, 0),
		strokes:           make([]Stroke, 0),
		currentDrawer:     nil,
		currentWord:       "",
		isCountdownActive: false,
	}
}

func (g *gameState) initDrawQueue() {
	for _, p := range g.room.Players {
		g.drawingQueue = append(g.drawingQueue, p.ID)
	}
}

func (g *gameState) nextDrawer() *player {
	if len(g.drawingQueue) == 0 {
		return nil
	}
	next := g.drawingQueue[0]
	g.drawingQueue = g.drawingQueue[1:]
	return g.room.Players[next]
}

type Phase interface {
	Name() string
	Begin(gs *gameState)   // called when the phase is starting
	End(gs *gameState)     // called when the phase is ending
	Advance(gs *gameState) // transition to the next phase
}

func (g *gameState) setPhase(phase Phase) {
	g.currentPhase.End(g)
	g.currentPhase = phase
	g.currentPhase.Begin(g)
}

type PhaseChangeMessage struct {
	Phase    string    `json:"phase"`
	Deadline time.Time `json:"deadline"`
}

func (g *gameState) Transition() bool {
	// if g.currentRound >= g.room.Settings.TotalRounds {
	// 	fmt.Println("Game over")
	// 	g.room.Stage = PostGame
	// 	g.room.broadcast(GameRoleAny, message(ChangeStage, g.room.Stage))
	// 	return false
	// }
	g.currentPhase.Advance(g)
	return true
}

type PickingPhase struct{}

func (phase PickingPhase) Name() string {
	return "picking"
}

// Start of picking phase
func (phase PickingPhase) Begin(g *gameState) {
	phaseDuration := time.Second * 30
	g.currentPhaseDeadline = time.Now().Add(phaseDuration - time.Second*1).UTC()
	slog.Info("picking phase started", "duration", phaseDuration)

	nextDrawer := g.nextDrawer()
	// if drawing queue is empty, attempt to refill
	if nextDrawer == nil {
		// we've reached the last round, end the game
		if g.currentRound >= g.room.Settings.TotalRounds {
			fmt.Println("Game over")
			g.room.Stage = PostGame
			g.room.broadcast(GameRoleAny, message(ChangeStage, g.room.Stage))
			return
		}
		// otherwise, refill and advance to next round
		g.currentRound++
		g.initDrawQueue()
		nextDrawer = g.nextDrawer()
	}

	// update next drawer's role
	nextDrawer.GameRole = GameRoleDrawing
	g.currentDrawer = nextDrawer

	// send next drawer their word options
	g.wordOptions = wordOptions(3)
	nextDrawer.Send(message(WordOptions, g.wordOptions))

	// send updated player info
	g.room.broadcast(GameRoleAny, message(SetPlayers, g.room.Players))

	g.strokes = emptyStrokeSlice()

	// notify players of the change
	g.room.broadcast(GameRoleAny,
		message(ChangePhase,
			PhaseChangeMessage{
				Phase:    g.currentPhase.Name(),
				Deadline: g.currentPhaseDeadline,
			}),
		message(SetRound, g.currentRound),
		message(ClearStrokes, nil),
	)

	// set the timer
	g.room.timer.Reset(phaseDuration)
}

// End of picking phase
func (phase PickingPhase) End(g *gameState) {
	fmt.Println("Picking phase ended")
}

// Advance to drawing phase
func (phase PickingPhase) Advance(g *gameState) {
	slog.Info("advancing to drawing phase")
	g.setPhase(&DrawingPhase{})
}

type DrawingPhase struct{}

func (phase DrawingPhase) Name() string {
	return "drawing"
}

// Start of drawing phase
func (phase DrawingPhase) Begin(g *gameState) {
	phaseDuration := time.Second * time.Duration(g.room.Settings.DrawingTimeAllowed)
	g.currentPhaseDeadline = time.Now().Add(phaseDuration - time.Second*1).UTC()
	fmt.Println("Drawing phase started", "duration", phaseDuration)

	// notify players of the change
	g.room.broadcast(GameRoleAny,
		message(ChangePhase,
			PhaseChangeMessage{
				Phase:    g.currentPhase.Name(),
				Deadline: g.currentPhaseDeadline,
			}))

	// set the timer
	g.room.timer.Reset(phaseDuration)
}

// End of drawing phase
func (phase DrawingPhase) End(g *gameState) {
	fmt.Println("Drawing phase ended")
}

// Advance to post drawing phase
func (phase DrawingPhase) Advance(g *gameState) {
	slog.Info("advancing to post drawing phase")

	g.setPhase(&PostDrawingPhase{})
}

type PostDrawingPhase struct{}

func (phase PostDrawingPhase) Name() string {
	return "postDrawing"
}

// Start of post drawing phase
func (phase PostDrawingPhase) Begin(g *gameState) {
	phaseDuration := time.Second * 10
	g.currentPhaseDeadline = time.Now().Add(phaseDuration - time.Second*1).UTC()
	fmt.Println("Post drawing phase started", "duration", phaseDuration)
	// notify players of the change
	g.room.broadcast(GameRoleAny,
		message(ChangePhase,
			PhaseChangeMessage{
				Phase:    g.currentPhase.Name(),
				Deadline: g.currentPhaseDeadline,
			}))
	// set the timer
	g.room.timer.Reset(phaseDuration)
}

// End of post drawing phase
func (phase PostDrawingPhase) End(g *gameState) {
	fmt.Println("Post drawing phase ended")
}

// Advance to picking phase
func (phase PostDrawingPhase) Advance(g *gameState) {
	slog.Info("advancing to picking phase")

	// update the drawer's role
	g.currentDrawer.GameRole = GameRoleGuessing
	g.setPhase(&PickingPhase{})
}
