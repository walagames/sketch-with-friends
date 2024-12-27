package main

import (
	"context"
	"encoding/csv"
	"fmt"
	"log"
	"log/slog"
	"math/rand"
	"os"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"
)

var (
	// Duration allowed for players to pick a word
	PickingPhaseDuration = time.Second * 15

	// Duration after drawing for score updates and displaying the word
	PostDrawingPhaseDuration = time.Second * 5
)

// DrawingWord represents a word that the drawer can choose from.
type DrawingWord struct {
	Category   string         `json:"-"`
	Value      string         `json:"value"`
	Difficulty WordDifficulty `json:"difficulty"`
}

var wordBank []DrawingWord

// This runs when the package is first imported.
// We use this to load the word bank from the CSV file once at startup.
func init() {
	loadWordBank()
}

type ChatMessage struct {
	ID              uuid.UUID `json:"id"`
	PlayerID        uuid.UUID `json:"playerId"`
	Guess           string    `json:"guess"`
	IsCorrect       bool      `json:"isCorrect"`
	PointsAwarded   int       `json:"pointsAwarded"`
	IsClose         bool      `json:"isClose"`
	IsSystemMessage bool      `json:"isSystemMessage"`
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
	wordOptions     []DrawingWord
	customWords     []DrawingWord
	currentWord     *DrawingWord
	hintedWord      string
	strokes         []Stroke
	chatMessages    []ChatMessage
	correctGuessers map[uuid.UUID]bool
	pointsAwarded   map[uuid.UUID]int

	// Time management
	currentPhaseDeadline time.Time
	isCountdownActive    bool
	cancelHintRoutine    context.CancelFunc
}

func NewGame(initialPhase Phase, r *room) *game {
	customWords := make([]DrawingWord, 0)
	for _, word := range r.Settings.CustomWords {
		customWords = append(customWords, DrawingWord{Value: word, Difficulty: WordDifficultyCustom, Category: "custom"})
	}

	return &game{
		room:              r,
		currentPhase:      initialPhase,
		currentRound:      1,
		drawingQueue:      make([]uuid.UUID, 0),
		wordOptions:       make([]DrawingWord, 0),
		customWords:       customWords,
		strokes:           make([]Stroke, 0),
		currentDrawer:     nil,
		currentWord:       nil,
		hintedWord:        "",
		isCountdownActive: false,
		chatMessages:      make([]ChatMessage, 0),
		correctGuessers:   make(map[uuid.UUID]bool),
		pointsAwarded:     make(map[uuid.UUID]int),
		isFirstPicking:    true,
		cancelHintRoutine: nil,
	}
}

func (g *game) SendSystemMessage(message string) {
	newMessage := ChatMessage{
		ID:              uuid.New(),
		PlayerID:        uuid.Nil,
		Guess:           message,
		IsCorrect:       false,
		PointsAwarded:   0,
		IsSystemMessage: true,
	}
	g.chatMessages = append(g.chatMessages, newMessage)
	g.room.broadcast(GameRoleAny, action(NewChatMessage, newMessage))
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
// The queue is sorted by score, so the first player in the queue
// is the player with the highest score.
func (g *game) fillDrawingQueue() {
	// Clear existing queue
	g.drawingQueue = make([]uuid.UUID, 0)

	// Convert map to slice
	players := make([]*player, 0, len(g.room.Players))
	for _, p := range g.room.Players {
		players = append(players, p)
	}

	// Sort players by score
	slices.SortFunc(players, func(a, b *player) int {
		return int(b.Score - a.Score)
	})

	// Add sorted players to queue
	for _, p := range players {
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
		// Remove the player from the correct guessers map and points awarded map.
		// This is necessary because the guessers map is used to determine if all
		// guessing players have guessed correctly.
		delete(g.correctGuessers, player.ID)
		delete(g.pointsAwarded, player.ID)

		// Filter out the player's messages
		newChatMessages := make([]ChatMessage, 0)
		for _, g := range g.chatMessages {
			if g.PlayerID != player.ID {
				newChatMessages = append(newChatMessages, g)
			}
		}
		g.chatMessages = newChatMessages

		g.room.broadcast(GameRoleAny, action(SetChat, g.chatMessages))
		g.SendSystemMessage(fmt.Sprintf("%s left the room", player.Profile.Name))
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
			g.currentWord = nil
		}

		// If the player left during the drawing phase, we need to skip to the post drawing phase.
		// Players may have already started guessing, so we need to clear the guesses and
		// cancel the hint routine.
		if g.currentPhase.Name() == Drawing {
			g.currentPhase.Next(g)
		}

		return
	}

	// Skip to the next phase if everyone has guessed correctly already
	if len(g.correctGuessers) >= len(g.room.Players)-2 {
		g.currentPhase.Next(g)
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
	distance := levenshteinDistance(guess, g.currentWord.Value)
	// Allow up to 1/3 of the word length to be different
	maxDistance := len(g.currentWord.Value) / 3

	return distance <= maxDistance
}

// Clears the guesses and resets the correct guessers map.
// Used when a new round starts.
func (g *game) clearChatMessages() {
	g.chatMessages = make([]ChatMessage, 0)
}

// Resets the correct guessers map.
// Used when a new round starts.
func (g *game) resetCorrectGuessers() {
	g.correctGuessers = make(map[uuid.UUID]bool)
}

// Checks if a player has guessed correctly.
func (g *game) playerHasAlreadyGuessedCorrect(playerID uuid.UUID) bool {
	return g.correctGuessers[playerID]
}

// Judges a guess and updates the game state accordingly.
func (g *game) judgeGuess(playerID uuid.UUID, guessValue string) {
	var result ChatMessage

	playerIsDrawing := g.currentDrawer.ID == playerID
	playerHasAlreadyGuessedCorrect := g.playerHasAlreadyGuessedCorrect(playerID)
	phaseIsActive := time.Now().Before(g.currentPhaseDeadline)

	// Check if the guess is correct if the player is not drawing and hasn't guessed correctly yet
	if strings.EqualFold(guessValue, g.currentWord.Value) && !playerHasAlreadyGuessedCorrect && !playerIsDrawing && phaseIsActive {
		remainingTime := time.Until(g.currentPhaseDeadline)
		totalTime := time.Duration(g.room.Settings.DrawingTimeAllowed) * time.Second

		timeShare := float64(remainingTime) / float64(totalTime)

		guesserPoints, drawerPoints := CalculateScore(len(g.room.Players)-1, len(g.correctGuessers), timeShare, g.currentWord.Difficulty, g.room.Settings.WordDifficulty)

		g.room.Players[playerID].Score += guesserPoints
		g.pointsAwarded[playerID] = guesserPoints

		// Award points to the drawer for making a good drawing
		g.currentDrawer.Score += drawerPoints
		g.pointsAwarded[g.currentDrawer.ID] += drawerPoints

		result = ChatMessage{
			ID:            uuid.New(),
			PlayerID:      playerID,
			Guess:         "", // Dont leak the correct word to the other players
			IsCorrect:     true,
			PointsAwarded: guesserPoints,
		}

		g.correctGuessers[playerID] = true
		g.room.Players[playerID].Send(action(SelectWord, g.currentWord.Value))
	} else {
		result = ChatMessage{
			ID:       uuid.New(),
			PlayerID: playerID,
			Guess:    guessValue,
		}

		if !playerIsDrawing && !playerHasAlreadyGuessedCorrect && phaseIsActive {
			result.IsClose = g.isGuessClose(strings.ToLower(guessValue))
		}
	}

	// Tell the other players about the guess
	g.chatMessages = append(g.chatMessages, result)
	g.room.broadcast(GameRoleAny, action(NewChatMessage, result))

	// Skip to the next phase if everyone has guessed correctly already
	if len(g.correctGuessers) >= len(g.room.Players)-1 {
		g.currentPhase.Next(g)
	}

}

// Loads the word bank from the CSV file.
func loadWordBank() {
	file, err := os.Open("words.csv")
	if err != nil {
		log.Fatalf("Failed to open CSV file: %v", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	// Skip header row
	if _, err := reader.Read(); err != nil {
		log.Fatalf("Failed to read CSV header: %v", err)
	}

	records, err := reader.ReadAll()
	if err != nil {
		log.Fatalf("Failed to read CSV data: %v", err)
	}

	wordBank = make([]DrawingWord, 0, len(records))
	for _, record := range records {
		if len(record) == 3 {
			wordBank = append(wordBank, DrawingWord{
				Category:   record[0],
				Value:      record[1],
				Difficulty: WordDifficulty(record[2]),
			})
		}
	}

	slog.Info("Loaded word bank", "word_count", len(wordBank))
}

// Returns unique, random words from the word bank based on the specified difficulty.
func (g *game) randomWordOptions(n int) []DrawingWord {
	// If the word bank is custom only, we use the custom words if there are any
	if g.room.Settings.WordBank == WordBankCustom && len(g.customWords) > 0 {
		return g.customWords[:min(n, len(g.customWords))]
	}

	// For non-random difficulty, use the original filtering logic
	if g.room.Settings.WordDifficulty != WordDifficultyRandom {
		filteredWords := wordBank
		if g.room.Settings.WordBank == WordBankMixed && len(g.customWords) > 0 {
			const customWordWeight = 3
			weightedCustomWords := make([]DrawingWord, 0, len(g.customWords)*customWordWeight)
			for i := 0; i < customWordWeight; i++ {
				weightedCustomWords = append(weightedCustomWords, g.customWords...)
			}
			filteredWords = append(filteredWords, weightedCustomWords...)
		}

		wordsByDifficulty := make([]DrawingWord, 0)
		for _, word := range filteredWords {
			if word.Difficulty == g.room.Settings.WordDifficulty || word.Difficulty == WordDifficultyCustom {
				wordsByDifficulty = append(wordsByDifficulty, word)
			}
		}

		// Create a set to ensure uniqueness
		wordSet := make(map[DrawingWord]struct{})
		for len(wordSet) < n && len(wordSet) < len(wordsByDifficulty) {
			word := wordsByDifficulty[rand.Intn(len(wordsByDifficulty))]
			wordSet[word] = struct{}{}
		}

		words := make([]DrawingWord, 0, len(wordSet))
		for word := range wordSet {
			words = append(words, word)
		}
		return words
	}

	// For random difficulty, get one word of each difficulty
	var easyWords, mediumWords, hardWords []DrawingWord
	for _, word := range wordBank {
		switch word.Difficulty {
		case WordDifficultyEasy:
			easyWords = append(easyWords, word)
		case WordDifficultyMedium:
			mediumWords = append(mediumWords, word)
		case WordDifficultyHard:
			hardWords = append(hardWords, word)
		}
	}

	result := make([]DrawingWord, 3)
	result[0] = easyWords[rand.Intn(len(easyWords))]
	result[1] = mediumWords[rand.Intn(len(mediumWords))]

	// 30% chance to use a custom word instead of a hard word if available and using mixed word bank
	if g.room.Settings.WordBank == WordBankMixed && len(g.customWords) > 0 && rand.Float32() < 0.3 {
		result[2] = g.customWords[rand.Intn(len(g.customWords))]
	} else {
		result[2] = hardWords[rand.Intn(len(hardWords))]
	}

	return result
}

// Applies a new hint to the hinted word.
func (g *game) applyHint() {
	prevWord := g.hintedWord
	fullWord := g.currentWord

	prevRunes := []rune(prevWord)
	fullRunes := []rune(fullWord.Value)
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
	// Will apply up to 60% of the word length as hints
	totalHints := int(float64(len(g.currentWord.Value)) * 0.6)
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
					p.Send(action(SelectWord, g.hintedWord))
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

	// If the queue is empty, we're at the end of a round
	if g.currentDrawer == nil {
		// It's the last round, end the game
		if g.currentRound >= g.room.Settings.TotalRounds {
			g.room.Stage = PreGame
			g.room.broadcast(GameRoleAny, action(ChangeStage, g.room.Stage))
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
	g.wordOptions = g.randomWordOptions(3)
	g.currentDrawer.Send(action(WordOptions, g.wordOptions))

	// Set the deadline to 1 second before the phase ends to allow
	// some buffer for the countdown timer to display.
	g.currentPhaseDeadline = time.Now().Add(PickingPhaseDuration).UTC()
	// Start the timer
	g.room.timer.Reset(PickingPhaseDuration)

	// Inform players of the state changes
	g.room.broadcast(GameRoleAny,
		action(SelectWord, ""),
		action(SetPlayers, g.room.Players),
		action(SetRound, g.currentRound),
		action(ChangePhase,
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
	if g.currentWord == nil {
		// Select a random word from the options
		randomIndex := rand.Intn(len(g.wordOptions) - 1)
		g.currentWord = &g.wordOptions[randomIndex]

		// Notify all players of the chosen word
		g.room.broadcast(GameRoleAny, action(SelectWord, g.currentWord.Value))
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
	g.currentPhaseDeadline = time.Now().Add(phaseDuration).UTC()

	// Initialize the hinted word with blanks but preserve spaces
	wordRunes := []rune(g.currentWord.Value)
	hintRunes := make([]rune, len(wordRunes))
	for i, r := range wordRunes {
		if r == ' ' || r == '-' {
			hintRunes[i] = r
		} else {
			hintRunes[i] = '*'
		}
	}
	g.hintedWord = string(hintRunes)
	g.room.broadcast(GameRoleGuessing, action(SelectWord, g.hintedWord))

	// We create a cancelable context for the hint routine
	// so we can cancel it if the drawing phase ends prematurely.
	ctx, cancel := context.WithCancel(context.Background())
	g.cancelHintRoutine = cancel

	// If the game mode is not no hints, we start the hint routine
	if g.room.Settings.GameMode != GameModeNoHints {
		// This will apply hints to the hinted word at a regular interval
		go g.hintRoutine(ctx, phaseDuration)
	}

	// Inform players of the phase change
	g.room.broadcast(GameRoleAny,
		action(ChangePhase,
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
	// Cleanup
	g.room.timer.Stop()
	g.cancelHintRoutine()
	// g.clearChatMessages()

	// Reveal the word
	g.hintedWord = g.currentWord.Value
	g.currentPhaseDeadline = time.Now().UTC()

	g.room.broadcast(GameRoleAny,
		action(SelectWord, g.hintedWord),
		// Send another phase change message to stop the countdown timer
		// in the case we advance early because everyone guessed correctly.
		action(ChangePhase, PhaseChangeMessage{
			Phase:        g.currentPhase.Name(),
			Deadline:     g.currentPhaseDeadline, // Stop the timer
			IsLastPhase:  false,
			IsFirstPhase: false,
		}))

	var msg string
	drawerName := "A player"

	if g.currentDrawer != nil {
		drawerName = g.currentDrawer.Profile.Name
	}

	if len(g.correctGuessers) == (len(g.room.Players) - 1) {
		msg = fmt.Sprintf("%s sketched %s and everyone got it!", drawerName, g.hintedWord)
	} else if len(g.correctGuessers) > 0 {
		playersStr := "player"
		if len(g.correctGuessers) > 1 {
			playersStr = "players"
		}
		msg = fmt.Sprintf("%s sketched %s and %d %s got it.", drawerName, g.hintedWord, len(g.correctGuessers), playersStr)
	} else if len(g.correctGuessers) == 0 {
		msg = fmt.Sprintf("%s sketched %s and no one got it lol", drawerName, g.hintedWord)
	} else {
		msg = fmt.Sprintf("%s sketched %s", drawerName, g.hintedWord)
	}

	g.SendSystemMessage(msg)

	// Inform players of the state changes
	g.room.broadcast(GameRoleAny,
		action(SetPlayers, g.room.Players),
	)

	g.resetCorrectGuessers()
}

func (phase DrawingPhase) Next(g *game) {
	g.setPhase(&PostDrawingPhase{})
}

type PostDrawingPhase struct{}

func (phase PostDrawingPhase) Name() PhaseName {
	return PostDrawing
}

func (phase PostDrawingPhase) Start(g *game) {
	go func() {
		// Wait for few seconds to allow players to see the correct word
		time.Sleep(time.Second * 5)

		phaseDuration := PostDrawingPhaseDuration

		// If its the last phase, we increase the duration to allow
		// players to see the correct word and scoreboard for longer.
		isLastPhase := g.currentRound >= g.room.Settings.TotalRounds && len(g.drawingQueue) == 0
		if isLastPhase {
			phaseDuration = time.Second * 15
		}

		// Set the deadline to 1 second before the phase ends to allow
		// some buffer for the countdown timer to display.
		g.currentPhaseDeadline = time.Now().Add(phaseDuration - time.Second*1).UTC()

		// Inform players of the phase change and points awarded
		g.room.broadcast(GameRoleAny,
			action(PointsAwarded, g.pointsAwarded),
			action(ChangePhase,
				PhaseChangeMessage{
					Phase:        g.currentPhase.Name(),
					Deadline:     g.currentPhaseDeadline,
					IsLastPhase:  isLastPhase,
					IsFirstPhase: false,
				}),
		)

		// Start the timer
		g.room.timer.Reset(phaseDuration)
	}()
}

func (phase PostDrawingPhase) End(g *game) {
	// Clear state for the next round
	g.strokes = emptyStrokeSlice()
	g.pointsAwarded = make(map[uuid.UUID]int)
	g.hintedWord = ""
	g.currentWord = nil

	// Reset everyones role so we can pick a new drawing
	// player in the next picking phase.
	for _, p := range g.room.Players {
		p.GameRole = GameRoleGuessing
		p.UpdateLimiter()
	}

	// Inform players of the state changes
	g.room.broadcast(GameRoleAny,
		action(ClearStrokes, nil),
		action(SetPlayers, g.room.Players),
	)
}

func (phase PostDrawingPhase) Next(g *game) {
	g.setPhase(&PickingPhase{})
}
