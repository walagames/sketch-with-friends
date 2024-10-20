package main

import (
	"context"
	"math/rand"
	"strings"
	"time"

	"github.com/google/uuid"
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

var (
	// Duration allowed for players to pick a word
	PickingPhaseDuration = time.Second * 15

	// Duration after drawing for score updates and displaying the word
	PostDrawingPhaseDuration = time.Second * 5
)

type guess struct {
	ID            uuid.UUID `json:"id"`
	PlayerID      uuid.UUID `json:"playerId"`
	Guess         string    `json:"guess"`
	IsCorrect     bool      `json:"isCorrect"`
	PointsAwarded int       `json:"pointsAwarded"`
	IsClose       bool      `json:"isClose"`
}

// game represents the current state of a game session.
// When a new game is started, a fresh game struct is created and assigned to the room.
// This ensures that each game session starts with a clean slate, even if players
// return to the lobby and start a new game. The room's game property is overwritten
// with this new instance, discarding any previous game state.
type game struct {
	// Room and game state
	room           *room
	currentPhase   Phase
	currentRound   int
	isFirstPicking bool
	drawingQueue   []uuid.UUID
	currentDrawer  *player

	// Word and drawing
	wordOptions     []string
	currentWord     string
	hintedWord      string
	strokes         []Stroke
	guesses         []guess
	correctGuessers map[uuid.UUID]bool

	// Time management
	currentPhaseDeadline time.Time
	isCountdownActive    bool
	cancelHintRoutine    context.CancelFunc
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
		correctGuessers:   make(map[uuid.UUID]bool),
		isFirstPicking:    true,
		cancelHintRoutine: nil,
	}
}

// Adds a player to the drawing queue.
func (g *game) enqueueDrawingPlayer(player *player) {
	g.drawingQueue = append(g.drawingQueue, player.ID)
}

// Returns the next player in the drawing queue
func (g *game) dequeueDrawingPlayer() *player {
	if len(g.drawingQueue) == 0 {
		return nil
	}
	next := g.drawingQueue[0]
	g.drawingQueue = g.drawingQueue[1:]
	return g.room.Players[next]
}

// Not the same as dequeueDrawingPlayer which returns the next player in the queue.
// This specifically is used when a player leaves mid-game and we need to manually
// remove them from the queue.
func (g *game) removePlayerFromDrawingQueue(playerID uuid.UUID) {
	for i, id := range g.drawingQueue {
		if id == playerID {
			g.drawingQueue = append(g.drawingQueue[:i], g.drawingQueue[i+1:]...)
			break
		}
	}
}

// Initializes the drawing queue with all players.
// Keep in mind that since players is defined using a map,
// the order of the players will not necessarily be the same each time.
func (g *game) fillDrawingQueue() {
	for _, p := range g.room.Players {
		g.enqueueDrawingPlayer(p)
	}
}

// Gracefully handles a player leaving in the middle of a game.
func (g *game) handlePlayerLeave(player *player) {
	// Remove player's guesses if they leave during the drawing phase:
	// 1. Prevents frontend errors when rendering guesses (avoids lookup of non-existent player)
	// 2. Useful for scenarios like kicking players for offensive language
	// Note: This is a design choice that may have future benefits.
	if g.currentPhase.Name() == Drawing {
		// Remove the player from the correct guessers map.
		// This is necessary because the guessers map is used to determine if all
		// guessing players have guessed correctly.
		delete(g.correctGuessers, player.ID)

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

	g.removePlayerFromDrawingQueue(player.ID)

	// Handle phase transitions if the player that left was the drawer
	if player.GameRole == GameRoleDrawing {
		// If the player left during the picking phase, we need to skip to the next picker.
		if g.currentPhase.Name() == Picking {
			g.room.timer.Stop()
			g.setPhase(&PickingPhase{})
			// We need to clear the current word AFTER setting the new phase
			// This is necessary because:
			// 1. The server assigns a random word at the end of the picking phase
			//    if the player didn't choose one (which is the case when they leave).
			// 2. If we don't clear the word here, the action validator will prevent
			//    the next drawer from picking their word, as it would think a word
			//    is already selected.
			g.currentWord = ""
		}

		// If the player left during the drawing phase, we need to skip to the post drawing phase.
		// Players may have already started guessing, so we need to clear the guesses and
		// cancel the hint routine.
		if g.currentPhase.Name() == Drawing {
			g.cancelHintRoutine()
			g.room.timer.Stop()
			g.currentPhase.Next(g)
		}
	}
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

// Clears the guesses and resets the correct guessers map.
// Used when a new round starts.
func (g *game) clearGuesses() {
	g.guesses = make([]guess, 0)
	g.correctGuessers = make(map[uuid.UUID]bool)
	g.room.broadcast(GameRoleAny,
		message(SetGuesses, g.guesses),
	)
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
	return int((float64(remainingTime) / float64(totalTime)) * float64(pointsPerGuess))
}

// Judges a guess and updates the game state accordingly.
func (g *game) judgeGuess(playerID uuid.UUID, guessText string) {
	// Convert both guess and current word to lowercase for case-insensitive comparison
	lowerGuess := strings.ToLower(guessText)
	lowerActualWord := strings.ToLower(g.currentWord)
	var result guess

	// Check if the guess is correct
	if lowerGuess == lowerActualWord {
		// Award points to the guesser for getting it right
		pointsEarned := g.calculatePoints(400)
		g.room.Players[playerID].Score += pointsEarned
		// Award points to the drawer for making a good drawing
		g.currentDrawer.Score += g.calculatePoints(100)

		result = guess{
			ID:            uuid.New(),
			PlayerID:      playerID,
			Guess:         "", // Dont leak the correct word to the other players
			IsCorrect:     true,
			PointsAwarded: pointsEarned,
		}

		g.correctGuessers[playerID] = true
		g.room.Players[playerID].Send(message(SelectWord, g.currentWord))
	} else {
		result = guess{
			ID:       uuid.New(),
			PlayerID: playerID,
			Guess:    guessText,
			IsClose:  g.isGuessClose(lowerGuess),
		}
	}

	// Tell the other players about the guess
	g.guesses = append(g.guesses, result)
	g.room.broadcast(GameRoleAny, message(GuessResult, result))

	// Skip to the next phase if everyone has guessed correctly already
	if len(g.correctGuessers) >= len(g.room.Players)-1 {
		// Cancel timers
		g.room.timer.Stop()
		g.cancelHintRoutine()

		// Display the word
		g.hintedWord = g.currentWord
		g.room.broadcast(GameRoleGuessing, message(SelectWord, g.hintedWord))
		time.Sleep(time.Duration(1 * time.Second)) // Short delay to display the word

		// Advance to the next phase
		g.currentPhase.Next(g)
	}
}

// Returns a slice of unique, random words from the word bank.
// We use this to give the drawer a selection of words to choose from.
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

// Applies a new hint to the hinted word.
func (g *game) applyHint() {
	prevWord := g.hintedWord
	fullWord := g.currentWord

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

// Applies hints to the hinted word at a regular interval.
// Launched as a goroutine in the Drawing phase.
func (g *game) hintRoutine(ctx context.Context, phaseDuration time.Duration) {
	g.hintedWord = strings.Repeat("*", len(g.currentWord))
	// Send the initial hinted word with all blanks
	g.room.broadcast(GameRoleGuessing, message(SelectWord, g.hintedWord))

	// Will apply up to 60% of the word length as hints
	totalHints := int(float64(len(g.currentWord)) * 0.6)
	// Apply hints at a regular interval so the last hint is applied with one interval left
	hintInterval := phaseDuration / time.Duration(totalHints+1)

	ticker := time.NewTicker(hintInterval)
	defer ticker.Stop()

	hintCount := 0
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// All hints applied, exit the routine
			if hintCount >= totalHints {
				g.cancelHintRoutine()
				break
			}

			g.applyHint()
			hintCount++

			for _, p := range g.room.Players {
				// Only send the hint to players who are guessing and haven't guessed correctly yet
				if p.GameRole == GameRoleGuessing && !g.correctGuessers[p.ID] {
					p.Send(message(SelectWord, g.hintedWord))
				}
			}
		}
	}
}

type PhaseName string

const (
	Picking     PhaseName = "picking"
	Drawing     PhaseName = "drawing"
	PostDrawing PhaseName = "postDrawing"
)

// Phases represent different stages of the game, each with specific behaviors and transitions.
// The game progresses through these phases in a cycle:
// 1. Picking: A player is chosen to draw and selects a word.
// 2. Drawing: The chosen player draws while others guess the word.
// 3. PostDrawing: A brief period after drawing for score updates and displaying the correctword.
//
// Each phase implements the Phase interface, defining how it starts, ends, and transitions
// to the next phase. This design allows for easy addition of new phases and modification
// of existing phase behavior without changing the core game logic.
type Phase interface {
	Name() PhaseName
	Start(g *game)
	End(g *game)
	Next(g *game)
}

// PhaseChangeMessage includes special isLastPhase and isFirstPhase properties
// to support different frontend animations for game transitions:
// - isFirstPhase: Used for the transition from the lobby view to the first game phase.
// - isLastPhase: Used for the transition from the last game phase back to the lobby view.
// These properties allow the frontend to apply distinct animations for entering/exiting.
// Deadline is used to derive remaining time for the countdown timer in the UI.
type PhaseChangeMessage struct {
	Phase        PhaseName `json:"phase"`
	Deadline     time.Time `json:"deadline"`
	IsLastPhase  bool      `json:"isLastPhase"`
	IsFirstPhase bool      `json:"isFirstPhase"`
}

// Ends the current phase and starts the next one.
// Used to transition between game phases
func (g *game) setPhase(phase Phase) {
	g.currentPhase.End(g)
	g.currentPhase = phase
	g.currentPhase.Start(g)
}

type PickingPhase struct{}

func (phase PickingPhase) Name() PhaseName {
	return Picking
}

func (phase PickingPhase) Start(g *game) {
	g.currentDrawer = g.dequeueDrawingPlayer()
	// We've reached the end of a round since the queue is empty
	if g.currentDrawer == nil {
		// It's the last round, end the game
		if g.currentRound >= g.room.Settings.TotalRounds {
			g.room.Stage = PreGame
			g.room.broadcast(GameRoleAny, message(ChangeStage, g.room.Stage))
			return
		}

		// Otherwise, refill the queue and increment the round
		g.currentRound++
		g.fillDrawingQueue()
		g.currentDrawer = g.dequeueDrawingPlayer()
	}

	// Update the drawer's role and limiter
	g.currentDrawer.GameRole = GameRoleDrawing
	g.currentDrawer.UpdateLimiter()

	// Send the drawer their word options
	g.wordOptions = wordOptions(3)
	g.currentDrawer.Send(message(WordOptions, g.wordOptions))

	// Set the deadline to 1 second before the phase ends to allow
	// some buffer for the countdown timer to display.
	g.currentPhaseDeadline = time.Now().Add(PickingPhaseDuration - time.Second*1).UTC()
	// Start the timer
	g.room.timer.Reset(PickingPhaseDuration)

	// Inform players of the state changes
	g.room.broadcast(GameRoleAny,
		message(SetPlayers, g.room.Players),
		message(SetRound, g.currentRound),
		message(ChangePhase,
			PhaseChangeMessage{
				Phase:        g.currentPhase.Name(),
				Deadline:     g.currentPhaseDeadline,
				IsLastPhase:  false,
				IsFirstPhase: g.isFirstPicking,
			}),
	)
	g.isFirstPicking = false
}

func (phase PickingPhase) End(g *game) {
	// If the player never choose a word, we pick one for them
	if g.currentWord == "" {
		// Select a random word from the options
		randomIndex := rand.Intn(len(g.wordOptions) - 1)
		g.currentWord = g.wordOptions[randomIndex]

		// Notify all players of the chosen word
		g.room.broadcast(GameRoleAny, message(SelectWord, g.currentWord))
	}
}

func (phase PickingPhase) Next(g *game) {
	g.setPhase(&DrawingPhase{})
}

type DrawingPhase struct{}

func (phase DrawingPhase) Name() PhaseName {
	return Drawing
}

func (phase DrawingPhase) Start(g *game) {
	phaseDuration := time.Duration(g.room.Settings.DrawingTimeAllowed) * time.Second
	// Set the deadline to 1 second before the phase ends to allow
	// some buffer for the countdown timer to display.
	g.currentPhaseDeadline = time.Now().Add(phaseDuration - time.Second*1).UTC()

	// We create a cancelable context for the hint routine
	// so we can cancel it if the drawing phase ends prematurely.
	ctx, cancel := context.WithCancel(context.Background())
	g.cancelHintRoutine = cancel
	// This will apply hints to the hinted word at a regular interval
	go g.hintRoutine(ctx, phaseDuration)

	// Only send the hinted word to the guessing players since the drawing
	// player already has the actual word.
	g.room.broadcast(GameRoleGuessing, message(SelectWord, g.hintedWord))

	// Inform players of the phase change
	g.room.broadcast(GameRoleAny,
		message(ChangePhase,
			PhaseChangeMessage{
				Phase:        g.currentPhase.Name(),
				Deadline:     g.currentPhaseDeadline,
				IsLastPhase:  false,
				IsFirstPhase: false,
			}),
	)

	// Start the timer
	g.room.timer.Reset(phaseDuration)
}

func (phase DrawingPhase) End(g *game) {
	g.clearGuesses()
	g.room.broadcast(GameRoleAny, message(SetPlayers, g.room.Players))
}

func (phase DrawingPhase) Next(g *game) {
	g.setPhase(&PostDrawingPhase{})
}

type PostDrawingPhase struct{}

func (phase PostDrawingPhase) Name() PhaseName {
	return PostDrawing
}

func (phase PostDrawingPhase) Start(g *game) {
	phaseDuration := PostDrawingPhaseDuration

	// If its the last phase, we increase the duration to allow
	// players to see the correct word and scoreboard for longer.
	isLastPhase := g.currentRound >= g.room.Settings.TotalRounds && len(g.drawingQueue) == 0
	if isLastPhase {
		phaseDuration = time.Second * 10
	}

	// Set the deadline to 1 second before the phase ends to allow
	// some buffer for the countdown timer to display.
	g.currentPhaseDeadline = time.Now().Add(phaseDuration - time.Second*1).UTC()

	// Inform players of the phase change
	g.room.broadcast(GameRoleAny,
		message(ChangePhase,
			PhaseChangeMessage{
				Phase:        g.currentPhase.Name(),
				Deadline:     g.currentPhaseDeadline,
				IsLastPhase:  isLastPhase,
				IsFirstPhase: false,
			}))

	// Start the timer
	g.room.timer.Reset(phaseDuration)
}

func (phase PostDrawingPhase) End(g *game) {
	// Clear state for the next round
	g.strokes = emptyStrokeSlice()
	g.hintedWord = ""
	g.currentWord = ""

	// Reset everyones role so we can pick a new drawing
	// player in the next picking phase.
	for _, p := range g.room.Players {
		p.GameRole = GameRoleGuessing
		p.UpdateLimiter()
	}

	// Inform players of the state changes
	g.room.broadcast(GameRoleAny,
		message(ClearStrokes, nil),
		message(SelectWord, ""),
		message(SetPlayers, g.room.Players),
	)
}

func (phase PostDrawingPhase) Next(g *game) {
	g.setPhase(&PickingPhase{})
}
