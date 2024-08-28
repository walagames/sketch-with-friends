package main

import (
	"context"
	"log/slog"
	"math"
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
	word                 string
	HintedWord           string `json:"word"`
	CurrentRound         int    `json:"currentRound"`
	TotalRounds          int    `json:"totalRounds"`
	drawingTime          int
	CurrentPhaseDeadline time.Time `json:"currentPhaseDeadline"`
	wordOptions          []string
	totalHints           int
	lettersRevealed      int
	hintInterval         time.Duration
	currentDrawingIndex  int
	timers               GameTimers
}
type GameTimers struct {
	Countdown   *time.Timer
	WordPicking *time.Timer
	Drawing     *time.Timer
	Hint        *time.Timer
	PostDrawing *time.Timer
}

func NewGame(numberOfRounds int, drawingTime int) Game {
	return &game{
		Strokes:             make([]Stroke, 0),
		event:               make(chan *RoomEvent, 5), // event buffer size of 5
		TotalRounds:         numberOfRounds,
		CurrentRound:        1,
		drawingTime:         drawingTime,
		currentDrawingIndex: 0,
	}
}

type GameRole string

const (
	Picking  GameRole = "PICKING"
	Drawing  GameRole = "DRAWING"
	Guessing GameRole = "GUESSING"
)

const (
	// Time after the drawing timer ends and before the next player picks a word
	// We reveal the word and show the updated leaderboard during this period
	PostDrawingTime = 10 * time.Second

	// Time before the game starts and the first player picks a word
	CountdownTime = 5 * time.Second

	// Time players have to pick a word they will draw
	WordPickingTime = 15 * time.Second
)

const (
	// Number of options the player drawing has to pick from
	WordOptions = 3
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

func (g *game) stopAllTimers() {
	g.timers.Countdown.Stop()
	g.timers.Drawing.Stop()
	g.timers.WordPicking.Stop()
	g.timers.Hint.Stop()
	g.timers.PostDrawing.Stop()
}

func (g *game) Run(ctx context.Context, r Room) {
	slog.Info("Game routine started: ")

	g.timers = GameTimers{
		Countdown:   time.NewTimer(CountdownTime),
		WordPicking: time.NewTimer(math.MaxInt64),
		Drawing:     time.NewTimer(math.MaxInt64),
		Hint:        time.NewTimer(math.MaxInt64),
		PostDrawing: time.NewTimer(math.MaxInt64),
	}

	defer func() {
		slog.Info("Game routine exited")
		g.stopAllTimers()
		r.ChangeStatus(WAITING)
		r.Broadcast(r.StateMsg())
	}()

	for {
		select {
		case <-ctx.Done():
			return
		case <-g.timers.Countdown.C:
			g.startPickingPhase(r)
		case <-g.timers.WordPicking.C:
			// Player didn't pick a word in time, so we pick a random word for them
			randomWordChoice := g.wordOptions[rand.Intn(len(g.wordOptions))]
			g.startDrawingPhase(r, randomWordChoice)
		case <-g.timers.Drawing.C:
			g.startPostDrawingPhase(r)
		case <-g.timers.Hint.C:
			slog.Info("hint timer expired")
			if g.lettersRevealed < g.totalHints {
				slog.Info("hinting word", "word", g.word, "hintedWord", g.HintedWord)
				g.hintWord()
				g.lettersRevealed++
				r.BroadcastExcept(r.StateMsg(), r.Players()[g.currentDrawingIndex])
				g.timers.Hint.Reset(g.hintInterval)
				continue
			}
			slog.Info("hint limit reached")
			g.timers.Hint.Stop()
		case <-g.timers.PostDrawing.C:
			r.Players()[g.currentDrawingIndex].ChangeGameRole(Guessing)
			g.currentDrawingIndex = (g.currentDrawingIndex + 1) % len(r.Players())
			if g.currentDrawingIndex == 0 {
				g.CurrentRound++
				if g.CurrentRound > g.TotalRounds {
					slog.Info("Game ended")
					return
				}
			}
			g.startPickingPhase(r)
		case e := <-g.event:
			switch e.Type {
			case STROKE, STROKE_POINT, CLEAR_STROKES, UNDO_STROKE:
				g.handleDrawingEvent(e)
			case PICK_WORD:
				g.timers.WordPicking.Stop()
				word := e.Payload.(string)
				g.startDrawingPhase(r, word)
			case GUESS:
				isGuessCorrect := g.word == e.Payload.(string)
				e.Player.Client().Send(marshalEvent(GUESS_RESPONSE, isGuessCorrect))
			default:
				slog.Warn("unhandled event", "event", e)
			}

			r.BroadcastExcept(marshalEvent(e.Type, e.Payload), e.Player)
		}
	}
}

func (g *game) startPickingPhase(r Room) {
	slog.Info("Picking phase started")
	// Pick the next drawing player
	players := r.Players()
	drawingPlayer := players[g.currentDrawingIndex]
	drawingPlayer.ChangeGameRole(Picking)

	// Send the word options to the drawing player
	g.wordOptions = g.randomWordOptions()
	drawingPlayer.Client().Send(marshalEvent(WORD_OPTIONS, g.wordOptions))

	// Set the word picking timer
	g.timers.WordPicking.Reset(WordPickingTime)
	g.CurrentPhaseDeadline = time.Now().Add(WordPickingTime).UTC()

	// Broadcast the state to all players
	r.Broadcast(r.StateMsg())
}

func (g *game) startDrawingPhase(r Room, word string) {
	slog.Info("Drawing phase started")
	// Initialize the word choice
	g.Strokes = make([]Stroke, 0)
	g.word = word
	g.HintedWord = ""
	g.calculateHints(g.word)
	g.hintWord()

	// Update the drawing player's game role
	drawingPlayer := r.Players()[g.currentDrawingIndex]
	drawingPlayer.ChangeGameRole(Drawing)

	// Reset the timers
	g.timers.Drawing.Reset(time.Duration(g.drawingTime) * time.Second)
	g.timers.Hint.Reset(g.hintInterval)
	g.CurrentPhaseDeadline = time.Now().Add(time.Duration(g.drawingTime) * time.Second).UTC()

	// Broadcast the state to all players
	r.Broadcast(r.StateMsg())
}

func (g *game) startPostDrawingPhase(r Room) {
	slog.Info("Post drawing phase started")
	// Reveal the word
	g.timers.Hint.Stop()
	g.HintedWord = g.word

	// Reset the timers
	g.CurrentPhaseDeadline = time.Now().Add(PostDrawingTime).UTC()
	g.timers.PostDrawing.Reset(PostDrawingTime)

	// Broadcast the state to all players
	r.Broadcast(r.StateMsg())
}

func (g *game) calculateHints(word string) {
	const hintPercentage = 0.6 // 60% of the word will be revealed

	wordLength := len(word)
	g.totalHints = int(math.Ceil(float64(wordLength) * hintPercentage))
	g.lettersRevealed = 0

	if g.totalHints >= wordLength {
		g.totalHints = wordLength - 1 // Always keep at least one letter hidden
	}

	g.hintInterval = time.Duration(g.drawingTime) * time.Second / time.Duration(g.totalHints)

	slog.Info("Hint calculation",
		"wordLength", wordLength,
		"totalHints", g.totalHints,
		"hintInterval", g.hintInterval)
}

func (g *game) State() *game {
	return g
}

func (g *game) EnqueueEvent(e *RoomEvent) {
	select {
	case g.event <- e:
	default:
		// If the channel is full, instead of blocking, the event just gets dropped
		// Not sure if this is the best way to handle this, in practice it shouldn't happen
		slog.Warn("game event channel full, dropping event", "event", e)
	}
}

func randomWord() string {
	return wordBank[rand.Intn(len(wordBank))]
}

func (g *game) randomWordOptions() []string {
	// Create a set to ensure uniqueness
	wordSet := make(map[string]struct{})

	// Keep adding words until we have the required number
	for len(wordSet) < WordOptions {
		word := randomWord()
		wordSet[word] = struct{}{}
	}

	// Convert set to slice
	words := make([]string, 0, WordOptions)
	for word := range wordSet {
		words = append(words, word)
	}

	return words
}

func (g *game) hintWord() {
	if g.HintedWord == "" {
		// Initialize hinted word with stars
		g.HintedWord = strings.Repeat("*", len(g.word))
	}

	wordRunes := []rune(g.word)
	hintedRunes := []rune(g.HintedWord)
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

	g.HintedWord = string(hintedRunes)
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
