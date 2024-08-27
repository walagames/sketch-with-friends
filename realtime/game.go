package main

import (
	"context"
	"log/slog"
	"math/rand"
	"strings"

	"time"
)

type Game interface {
	Run(ctx context.Context, r Room)
	EnqueueEvent(e *RoomEvent)
	State() *game
}

type game struct {
	event                chan *RoomEvent
	Strokes              []Stroke `json:"strokes"`
	rounds               int
	word                 string
	hintedWord           string
	roundEndsAt          time.Time
	currentRound         int
	currentRoundEndsAt   time.Time
	drawingOrder         []string
	currentDrawingIndex  int
	currentDrawingPlayer string
}

func NewGame() Game {
	return &game{
		Strokes:      make([]Stroke, 0),
		event:        make(chan *RoomEvent, 5), // event buffer size of 5
		rounds:       3,
		currentRound: 1,
	}
}

type GameRole string

const (
	Picking  GameRole = "PICKING"
	Drawing  GameRole = "DRAWING"
	Guessing GameRole = "GUESSING"
)

const (
	// Time the drawing player has to draw the word
	DrawingTime = 60 * time.Second

	// Time after the drawing timer ends and before the next player picks a word
	// We reveal the word and show the updated leaderboard during this period
	PostDrawingTime = 10 * time.Second

	// Time before the game starts and the first player picks a word
	CountdownTime = 5 * time.Second

	// Time players have to pick a word they will draw
	WordPickingTime = 15 * time.Second

	// Interval between when new letters are revealed
	HintTime = 10 * time.Second
)

const (
	// Number of options the player drawing has to pick from
	WordOptions = 3

	// Number of letters revealed of a word
	LetterHints = 2
)

var wordBank = []string{
	"cat",
	"dog",
	"house",
	"tree",
	"book",
	"chair",
	"sun",
	"moon",
	"flower",
	"computer",
}

func (g *game) Run(ctx context.Context, r Room) {
	slog.Info("Game routine started: ")

	startTimer := time.NewTimer(CountdownTime)
	var drawingTimer *time.Timer
	var wordPickingTimer *time.Timer
	var hintTimer *time.Timer
	var postDrawingTimer *time.Timer

	defer func() {
		slog.Info("Game routine exited")
		if startTimer != nil {
			startTimer.Stop()
		}
		if drawingTimer != nil {
			drawingTimer.Stop()
		}
		if wordPickingTimer != nil {
			wordPickingTimer.Stop()
		}
		if hintTimer != nil {
			hintTimer.Stop()
		}
		if postDrawingTimer != nil {
			postDrawingTimer.Stop()
		}
	}()

	/*
		- 3, 2, 1 Countdown at game start, picking word timer begins
		- First drawing player picks word or timer runs out, word is set, drawing timer begins, hinting timer begins
		- Players guess until all have guessed right or drawing timer runs out, drawing timer ends, post round timer starts
		- Post round timer ends, next players turn, picking time begins



		- picking phase
		- drawing phase
		- end phase
	*/

	for {
		select {
		case <-ctx.Done():
			return
		case <-startTimer.C:
			slog.Info("startTimer expired")
			players := r.Players()
			players[0].ChangeGameRole(Drawing)
			r.Broadcast(r.StateMsg())
			// TODO: pick drawing player and broadcast state (including the word options for the drawing player)
			// r.BroadcastExcept(g.stateMsg(Picking), nil)
			// wordPickingTimer.Reset(WordPickingTime)
		// case <-wordPickingTimer.C:
			// g.word = g.newWord()
			// drawingTimer.Reset(DrawingTime)
			// TODO: broadcast state
		// case <-drawingTimer.C:
			// TODO: broadcast state
			// postDrawingTimer.Reset(PostDrawingTime)
		// case <-hintTimer.C:
			// g.hintWord()
			// hintTimer.Reset(HintTime)
		// case <-postDrawingTimer.C:
			// TODO: broadcast state
			// wordPickingTimer.Reset(WordPickingTime)

		case e := <-g.event:
			switch e.Type {
			case STROKE, STROKE_POINT, CLEAR_STROKES, UNDO_STROKE:
				g.handleDrawingEvent(e)
			case WORD_PICKED:
				g.word = e.Payload.(string)
				g.hintWord()
				hintTimer.Stop()
				drawingTimer.Reset(DrawingTime)
			default:
				slog.Warn("unhandled event", "event", e)
			}

			r.BroadcastExcept(marshalEvent(e.Type, e.Payload), e.Player)
		}
	}
}

func (g *game) State() *game {
	return g
}

func (g *game) initializeGame(players []*PlayerInfo) {
	// Create drawing order
	g.drawingOrder = make([]string, len(players))
	for i, player := range players {
		g.drawingOrder[i] = player.ID
	}
	// Shuffle the drawing order
	rand.Shuffle(len(g.drawingOrder), func(i, j int) {
		g.drawingOrder[i], g.drawingOrder[j] = g.drawingOrder[j], g.drawingOrder[i]
	})
	g.currentDrawingIndex = 0
	g.currentDrawingPlayer = g.drawingOrder[0]
}

type Stroke struct {
	Points [][]int `json:"points"`
	Color  string  `json:"color"` // hex color
	Width  int     `json:"width"`
}

// Decodes a stroke payload and adds it to the strokes slice
func (g *game) addStroke(payload interface{}) {
	stroke, err := decodePayload[Stroke](payload)
	if err != nil {
		slog.Warn("failed to decode stroke", "error", err)
		return
	}
	g.Strokes = append(g.Strokes, stroke)
}

// Decodes a stroke point payload and appends it to the most recent stroke
func (g *game) addStrokePoint(payload interface{}) {
	point, err := decodePayload[[]int](payload)
	if err != nil {
		slog.Warn("failed to decode stroke point", "error", err)
		return
	}
	g.Strokes[len(g.Strokes)-1].Points = append(g.Strokes[len(g.Strokes)-1].Points, point)
}

// Removes all strokes from the strokes slice by creating a new empty slice
func (g *game) clearStrokes() {
	g.Strokes = make([]Stroke, 0)
}

// Removes the most recent stroke from the strokes slice
func (g *game) undoStroke() {
	if len(g.Strokes) > 0 {
		g.Strokes = g.Strokes[:len(g.Strokes)-1]
	}
}

func (g *game) handleDrawingEvent(e *RoomEvent) {
	switch e.Type {
	case STROKE:
		g.addStroke(e.Payload)
	case STROKE_POINT:
		g.addStrokePoint(e.Payload)
	case CLEAR_STROKES:
		g.clearStrokes()
	case UNDO_STROKE:
		g.undoStroke()
	}
}

// This method is used by the room to pass events to the game
func (g *game) EnqueueEvent(e *RoomEvent) {
	select {
	case g.event <- e:
	default:
		// If the channel is full, instead of blocking, the event just gets dropped
		// Not sure if this is the best way to handle this, in practice it shouldn't happen
		slog.Warn("game event channel full, dropping event", "event", e)
	}
}

func (g *game) stateMsg(role GameRole) []byte {
	type gameState struct {
		Strokes     []Stroke  `json:"strokes"`
		Word        string    `json:"word"`
		Role        GameRole  `json:"role"`
		Round       int       `json:"round"`
		RoundEndsAt time.Time `json:"roundEndsAt"`
	}

	state := &gameState{
		Strokes:     g.Strokes,
		Role:        role,
		Round:       g.currentRound,
		RoundEndsAt: g.roundEndsAt.UTC(),
		Word:        g.hintedWord,
	}

	if role == Drawing {
		state.Word = g.word
	}

	return marshalEvent(GAME_STATE, state)
}

func (g *game) newWord() string {
	return wordBank[rand.Intn(len(wordBank))]
}

func (g *game) hintWord() {
	if g.hintedWord == "" {
		// Initialize hinted word with stars
		g.hintedWord = strings.Repeat("*", len(g.word))
	}

	wordRunes := []rune(g.word)
	hintedRunes := []rune(g.hintedWord)
	hiddenIndices := []int{}

	// Find all hidden letter positions
	for i, r := range hintedRunes {
		if r == '*' {
			hiddenIndices = append(hiddenIndices, i)
		}
	}

	if len(hiddenIndices) <= 1 {
		return // Keep at least one letter hidden
	}

	// Choose a random hidden position
	randomIndex := hiddenIndices[rand.Intn(len(hiddenIndices)-1)]

	// Replace the star with the actual letter
	hintedRunes[randomIndex] = wordRunes[randomIndex]

	g.hintedWord = string(hintedRunes)
}
