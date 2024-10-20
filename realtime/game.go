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

type guess struct {
	PlayerID      uuid.UUID `json:"playerId"`
	Guess         string    `json:"guess"`
	IsCorrect     bool      `json:"isCorrect"`
	PointsAwarded int       `json:"pointsAwarded"`
	IsClose       bool      `json:"isClose"`
}

type game struct {
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
	correctGuessers      []uuid.UUID
	cancelHintRoutine    context.CancelFunc
	isFirstPicking       bool
}

func NewGame(initialPhase Phase, r *room) *game {
	return &game{
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
		correctGuessers:   make([]uuid.UUID, 0),
		isFirstPicking:    true,
		cancelHintRoutine: nil,
	}
}

func (g *game) queueLateJoiner(player *player) {
	g.drawingQueue = append(g.drawingQueue, player.ID)
}

// levenshteinDistance calculates the distance between two strings.
// We use this to check if a guess is close to the current word.
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

// Checks if a guess is close to the current word.
// We use this to indicate in chat that a guess was incorrect but close.
func (g *game) isGuessClose(guess string) bool {
	distance := levenshteinDistance(guess, g.currentWord)
	// Allow up to 1/3 of the word length to be different
	maxDistance := len(g.currentWord) / 3

	return distance <= maxDistance
}

// Calculates the point award for guessing a word correctly.
// Points are calculated based on the percentage of time remaining.
// We use this to calculate points for both the guesser and the drawer.
func (g *game) calculatePoints(pointsPerGuess int) int {
	remainingTime := time.Until(g.currentPhaseDeadline)
	totalTime := time.Duration(g.room.Settings.DrawingTimeAllowed) * time.Second
	if remainingTime <= 0 {
		return 0
	}

	// Calculate points based on remaining time, max 500 points
	points := int((float64(remainingTime) / float64(totalTime)) * float64(pointsPerGuess))

	return points
}

// Initializes the drawing queue with all players.
// Keep in mind that since players is defined as a map,
// range will not necessarily produce the same order each time.
func (g *game) fillDrawingQueue() {
	for _, p := range g.room.Players {
		g.drawingQueue = append(g.drawingQueue, p.ID)
	}
}

// Returns the next player in the drawing queue
// If a player is not in the room (they left), it will try again.
func (g *game) nextDrawer() *player {
	if len(g.drawingQueue) == 0 {
		return nil
	}
	next := g.drawingQueue[0]
	g.drawingQueue = g.drawingQueue[1:]
	if _, ok := g.room.Players[next]; !ok {
		slog.Info("next drawer is not in the room, trying again", "player", next)
		// player has left the room, try again
		return g.nextDrawer()
	}
	return g.room.Players[next]
}

func (g *game) removePlayerGuesses(player *player) {
	if g.currentPhase.Name() == Drawing {
		// Filter out the player from the correct guessers
		newCorrectGuessers := make([]uuid.UUID, 0)
		for _, p := range g.correctGuessers {
			if p != player.ID {
				newCorrectGuessers = append(newCorrectGuessers, p)
			}
		}
		g.correctGuessers = newCorrectGuessers

		// Filter out the player's guesses
		newGuesses := make([]guess, 0)
		for _, g := range g.guesses {
			if g.PlayerID != player.ID {
				newGuesses = append(newGuesses, g)
			}
		}
		g.guesses = newGuesses

		g.room.broadcast(GameRoleAny, message(SetGuesses, g.guesses))
	}

	if player.GameRole == GameRoleDrawing {
		if g.currentPhase.Name() == Picking {
			slog.Info("drawer left during picking, skipping to post drawing phase")
			g.room.timer.Stop()
			g.setPhase(&PickingPhase{})
			g.currentWord = ""
		}

		if g.currentPhase.Name() == Drawing {
			slog.Info("drawer left during drawing phase, skipping to post drawing phase")
			g.room.timer.Stop()
			g.AdvanceToNextPhase()
		}
	}
}

// Ends the current phase and starts the next one
func (g *game) setPhase(phase Phase) {
	g.currentPhase.End(g)
	g.currentPhase = phase
	g.currentPhase.Start(g)
}

func (g *game) AdvanceToNextPhase() {
	g.currentPhase.Next(g)
}

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

func wordOptions(n int) []string {
	// Create a set to ensure uniqueness
	wordSet := make(map[string]struct{})

	// Keep adding words until we have the required number
	for len(wordSet) < n {
		word := wordBank[rand.Intn(len(wordBank))]
		wordSet[word] = struct{}{}
	}

	// Convert set to slice
	words := make([]string, 0, n)
	for word := range wordSet {
		words = append(words, word)
	}

	return words
}

func (g *game) applyHint() {
	prevWord := g.hintedWord
	fullWord := g.currentWord
	if prevWord == fullWord {
		// First iteration: create initial hinted word
		prevWord = strings.Repeat("*", len(fullWord))
	}

	prevRunes := []rune(prevWord)
	fullRunes := []rune(fullWord)
	hiddenIndices := []int{}

	// Find all hidden letter positions
	for i, r := range prevRunes {
		if r == '*' {
			hiddenIndices = append(hiddenIndices, i)
		}
	}

	if len(hiddenIndices) == 0 {
		return // All letters are already revealed
	}

	// Choose a random hidden position
	randomIndex := hiddenIndices[rand.Intn(len(hiddenIndices))]

	// Replace the star with the actual letter
	prevRunes[randomIndex] = fullRunes[randomIndex]

	g.hintedWord = string(prevRunes)
}

type PhaseName string

const (
	Picking     PhaseName = "picking"
	Drawing     PhaseName = "drawing"
	PostDrawing PhaseName = "postDrawing"
)

type Phase interface {
	Name() PhaseName
	Start(g *game)
	End(g *game)
	Next(g *game)
}

type PhaseChangeMessage struct {
	Phase        PhaseName `json:"phase"`
	Deadline     time.Time `json:"deadline"`
	IsLastPhase  bool      `json:"isLastPhase"`
	IsFirstPhase bool      `json:"isFirstPhase"`
}

type PickingPhase struct{}

func (phase PickingPhase) Name() PhaseName {
	return Picking
}
func (phase PickingPhase) Start(g *game) {
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
		g.fillDrawingQueue()
		nextDrawer = g.nextDrawer()
	}

	for _, p := range g.room.Players {
		p.GameRole = GameRoleGuessing
		p.UpdateLimiter()
	}

	// update next drawer's role
	nextDrawer.GameRole = GameRoleDrawing
	g.currentDrawer = nextDrawer
	nextDrawer.UpdateLimiter()

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
				Phase:        g.currentPhase.Name(),
				Deadline:     g.currentPhaseDeadline,
				IsLastPhase:  false,
				IsFirstPhase: g.isFirstPicking,
			}),
		message(SetRound, g.currentRound),
	)
	g.isFirstPicking = false

	// set the timer
	g.room.timer.Reset(phaseDuration)
}
func (phase PickingPhase) End(g *game) {
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
func (phase PickingPhase) Next(g *game) {
	slog.Info("advancing to drawing phase")
	g.setPhase(&DrawingPhase{})
}

type DrawingPhase struct{}

func (phase DrawingPhase) Name() PhaseName {
	return Drawing
}
func (phase DrawingPhase) Start(g *game) {
	phaseDuration := time.Second * time.Duration(g.room.Settings.DrawingTimeAllowed)
	g.currentPhaseDeadline = time.Now().Add(phaseDuration - time.Second*1).UTC()
	fmt.Println("Drawing phase started", "duration", phaseDuration)

	// Calculate number of hints and interval
	totalHints := int(float64(len(g.currentWord)) * 0.6)
	hintInterval := phaseDuration / time.Duration(totalHints+1)

	// Initialize hinted word with all blanks
	g.hintedWord = strings.Repeat("*", len(g.currentWord))

	// Create a context that can be canceled
	ctx, cancel := context.WithCancel(context.Background())
	g.cancelHintRoutine = cancel

	// Start the hint goroutine
	go func() {
		ticker := time.NewTicker(hintInterval)
		defer ticker.Stop()

		hintCount := 0
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if hintCount >= totalHints {
					cancel() // All hints applied, cancel the context
					return
				}
				g.applyHint()
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
func (phase DrawingPhase) End(g *game) {
	g.clearGuesses()
	g.correctGuessers = make([]uuid.UUID, 0)
	g.hintedWord = ""
	g.currentWord = ""
	fmt.Println("Drawing phase ended")
	g.room.broadcast(GameRoleAny, message(SetPlayers, g.room.Players))
}
func (phase DrawingPhase) Next(g *game) {
	slog.Info("advancing to post drawing phase")

	g.setPhase(&PostDrawingPhase{})
}

type PostDrawingPhase struct{}

func (phase PostDrawingPhase) Name() PhaseName {
	return PostDrawing
}
func (phase PostDrawingPhase) Start(g *game) {
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
func (phase PostDrawingPhase) End(g *game) {
	g.room.broadcast(GameRoleAny,
		message(ClearStrokes, nil),
		message(SelectWord, ""),
	)
	slog.Info("selected word", "word", "")
	fmt.Println("Post drawing phase ended")
	slog.Info("advancing to picking phase")
}
func (phase PostDrawingPhase) Next(g *game) {
	slog.Info("advancing to picking phase")

	// update the drawer's role
	g.currentDrawer.GameRole = GameRoleGuessing
	g.setPhase(&PickingPhase{})
}

func (g *game) clearGuesses() {
	g.guesses = make([]guess, 0)
	g.correctGuessers = make([]uuid.UUID, 0)
	g.room.broadcast(GameRoleAny, message(SetGuesses, g.guesses))
}

func (g *game) judgeGuess(playerID uuid.UUID, guessText string) {
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
		g.correctGuessers = append(g.correctGuessers, playerID)
		g.room.Players[playerID].Send(message(SelectWord, g.currentWord))
		slog.Info("select word", "word", g.currentWord)

		// Award points to the drawer
		g.currentDrawer.Score += g.calculatePoints(100)
	} else {
		// Check for close guesses (e.g., typos, minor differences)
		result.IsClose = g.isGuessClose(lowerGuess)
	}

	g.guesses = append(g.guesses, result)
	g.room.broadcast(GameRoleAny, message(GuessResult, result))
	if len(g.correctGuessers) >= len(g.room.Players)-1 {
		g.room.timer.Stop()
		g.cancelHintRoutine()
		g.hintedWord = g.currentWord
		g.room.broadcast(GameRoleGuessing, message(SelectWord, g.hintedWord))
		slog.Info("select word", "hinted word", g.hintedWord)
		time.Sleep(time.Duration(1 * time.Second))
		g.AdvanceToNextPhase()
	}
}
