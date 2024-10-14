package main

import (
	"context"
	"fmt"
	"log/slog"
	"math/rand"
	"strings"
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
	hintedWord           string
	currentPhaseDeadline time.Time
	isCountdownActive    bool
	guesses              []guess
	correctGuessCount    int
	cancelHintRoutine    context.CancelFunc
}

type guess struct {
	PlayerID      uuid.UUID `json:"playerId"`
	Guess         string    `json:"guess"`
	IsCorrect     bool      `json:"isCorrect"`
	PointsAwarded int       `json:"pointsAwarded"`
	IsClose       bool      `json:"isClose"`
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
		hintedWord:        "",
		isCountdownActive: false,
		guesses:           make([]guess, 0),
		correctGuessCount: 0,
		cancelHintRoutine: nil,
	}
}

func (g *gameState) resetGuesses() {
	g.guesses = make([]guess, 0)
	g.room.broadcast(GameRoleAny, message(SetGuesses, g.guesses))
}

func (g *gameState) judgeGuess(playerID uuid.UUID, guessText string) {
	result := guess{
		PlayerID:  playerID,
		Guess:     guessText,
		IsCorrect: false,
		IsClose:   false,
	}

	// Convert both guess and current word to lowercase for case-insensitive comparison
	lowerGuess := strings.ToLower(guessText)
	lowerWord := strings.ToLower(g.currentWord)

	if lowerGuess == lowerWord {
		result.IsCorrect = true
		result.PointsAwarded = g.calculatePoints(400)
		g.room.Players[playerID].Score += result.PointsAwarded
		result.Guess = ""
		g.correctGuessCount++
		g.room.Players[playerID].Send(message(SelectWord, g.currentWord))
		slog.Info("select word", "word", g.currentWord)

		// Award points to the drawer
		g.currentDrawer.Score += g.calculatePoints(100)
	} else {
		// Check for close guesses (e.g., typos, minor differences)
		result.IsClose = isCloseGuess(lowerGuess, lowerWord)
	}

	g.guesses = append(g.guesses, result)
	g.room.broadcast(GameRoleAny, message(GuessResult, result))
	if g.correctGuessCount >= len(g.room.Players)-1 {
		g.room.timer.Stop()
		g.cancelHintRoutine()
		g.hintedWord = g.currentWord
		g.room.broadcast(GameRoleGuessing, message(SelectWord, g.hintedWord))
		slog.Info("select word", "hinted word", g.hintedWord)
		time.Sleep(time.Duration(1 * time.Second))
		g.Transition()
	}
}

func (g *gameState) calculatePoints(pointsPerGuess int) int {
	remainingTime := time.Until(g.currentPhaseDeadline)
	totalTime := time.Duration(g.room.Settings.DrawingTimeAllowed) * time.Second

	if remainingTime <= 0 {
		return 0
	}

	// Calculate points based on remaining time, max 500 points
	points := int((float64(remainingTime) / float64(totalTime)) * float64(pointsPerGuess))

	return points
}

// Helper function to determine if a guess is close to the correct word
func isCloseGuess(guess, word string) bool {
	// Use Levenshtein distance to determine if the guess is close
	distance := levenshteinDistance(guess, word)
	maxDistance := len(word) / 3 // Allow up to 1/3 of the word length to be different

	return distance <= maxDistance
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
	Phase        string    `json:"phase"`
	Deadline     time.Time `json:"deadline"`
	IsLastPhase  bool      `json:"isLastPhase"`
	IsFirstPhase bool      `json:"isFirstPhase"`
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
	phaseDuration := time.Second * 15
	g.currentPhaseDeadline = time.Now().Add(phaseDuration - time.Second*1).UTC()
	slog.Info("picking phase started", "duration", phaseDuration)

	nextDrawer := g.nextDrawer()
	// if drawing queue is empty, attempt to refill
	if nextDrawer == nil {
		// we've reached the last round, end the game
		if g.currentRound >= g.room.Settings.TotalRounds {
			fmt.Println("Game over")
			g.room.Stage = PreGame
			g.room.broadcast(GameRoleAny, message(ChangeStage, g.room.Stage))
			return
		}
		// otherwise, refill and advance to next round
		g.currentRound++
		g.initDrawQueue()
		nextDrawer = g.nextDrawer()
	}

	for _, p := range g.room.Players {
		p.GameRole = GameRoleGuessing
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

	isFirstPickingPhase := g.currentRound == 1 && len(g.drawingQueue) == len(g.room.Players)-1
	// notify players of the change
	g.room.broadcast(GameRoleAny,
		message(ChangePhase,
			PhaseChangeMessage{
				Phase:        g.currentPhase.Name(),
				Deadline:     g.currentPhaseDeadline,
				IsLastPhase:  false,
				IsFirstPhase: isFirstPickingPhase,
			}),
		message(SetRound, g.currentRound),
	)

	// set the timer
	g.room.timer.Reset(phaseDuration)
}

// End of picking phase
func (phase PickingPhase) End(g *gameState) {
	if g.currentWord == "" {
		// Pick a random word if none was chosen
		randomIndex := rand.Intn(len(g.wordOptions) - 1)
		g.currentWord = g.wordOptions[randomIndex]
		slog.Info("No word chosen, randomly selected", "word", g.currentWord)

		// Notify all players of the chosen word
		g.room.broadcast(GameRoleAny, message(SelectWord, g.currentWord))
		slog.Info("select word", "word", g.currentWord)
	}

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

	// Initialize hinted word with one hint applied
	g.hintedWord = applyHint(g.currentWord, g.currentWord)

	// Calculate number of hints and interval
	totalHints := int(float64(len(g.currentWord)) * 0.6)
	hintInterval := phaseDuration / time.Duration(totalHints+1)

	// Create a context that can be canceled
	ctx, cancel := context.WithCancel(context.Background())
	g.cancelHintRoutine = cancel

	// Start the hint goroutine
	go func() {
		ticker := time.NewTicker(hintInterval)
		defer ticker.Stop()

		hintCount := 1 // We've already applied one hint
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if hintCount >= totalHints {
					cancel() // All hints applied, cancel the context
					return
				}
				g.hintedWord = applyHint(g.hintedWord, g.currentWord)
				g.room.broadcast(GameRoleGuessing, message(SelectWord, g.hintedWord))
				slog.Info("select word", "hinted word", g.hintedWord)
				hintCount++
			}
		}
	}()

	// notify players of the change
	g.room.broadcast(GameRoleGuessing, message(SelectWord, g.hintedWord))
	slog.Info("select word", "hinted word", g.hintedWord)
	g.room.broadcast(GameRoleAny,
		message(ChangePhase,
			PhaseChangeMessage{
				Phase:        g.currentPhase.Name(),
				Deadline:     g.currentPhaseDeadline,
				IsLastPhase:  false,
				IsFirstPhase: false,
			}),
	)

	// set the timer
	g.room.timer.Reset(phaseDuration)
}

// End of drawing phase
func (phase DrawingPhase) End(g *gameState) {
	g.resetGuesses()
	g.correctGuessCount = 0
	g.hintedWord = ""
	g.currentWord = ""
	fmt.Println("Drawing phase ended")
	g.room.broadcast(GameRoleAny, message(SetPlayers, g.room.Players))
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
	isLastPhase := g.currentRound >= g.room.Settings.TotalRounds && len(g.drawingQueue) == 0
	phaseDuration := time.Second * 5
	if isLastPhase {
		phaseDuration = time.Second * 10
	}
	g.currentPhaseDeadline = time.Now().Add(phaseDuration - time.Second*1).UTC()
	fmt.Println("Post drawing phase started", "duration", phaseDuration)
	// notify players of the change

	g.room.broadcast(GameRoleAny,
		message(ChangePhase,
			PhaseChangeMessage{
				Phase:        g.currentPhase.Name(),
				Deadline:     g.currentPhaseDeadline,
				IsLastPhase:  isLastPhase,
				IsFirstPhase: false,
			}))
	// set the timer
	g.room.timer.Reset(phaseDuration)
}

// End of post drawing phase
func (phase PostDrawingPhase) End(g *gameState) {
	g.room.broadcast(GameRoleAny,
		message(ClearStrokes, nil),
		message(SelectWord, ""),
	)
	slog.Info("selected word", "word", "")
	fmt.Println("Post drawing phase ended")
}

// Advance to picking phase
func (phase PostDrawingPhase) Advance(g *gameState) {
	slog.Info("advancing to picking phase")

	// update the drawer's role
	g.currentDrawer.GameRole = GameRoleGuessing
	g.setPhase(&PickingPhase{})
}

// levenshteinDistance calculates the Levenshtein distance between two strings
func levenshteinDistance(s1, s2 string) int {
	m, n := len(s1), len(s2)
	d := make([][]int, m+1)
	for i := range d {
		d[i] = make([]int, n+1)
		d[i][0] = i
	}
	for j := 1; j <= n; j++ {
		d[0][j] = j
	}
	for j := 1; j <= n; j++ {
		for i := 1; i <= m; i++ {
			if s1[i-1] == s2[j-1] {
				d[i][j] = d[i-1][j-1]
			} else {
				d[i][j] = min(d[i-1][j]+1, min(d[i][j-1]+1, d[i-1][j-1]+1))
			}
		}
	}
	return d[m][n]
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
