package main

import (
	"errors"
	"fmt"
	"log/slog"
	"math/rand"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	ScheduledHintReveal      ScheduledEventType = "hint_reveal"
	ScheduledDrawingPhaseEnd ScheduledEventType = "drawing_phase_end"
)

var (
	ErrOnlyDrawerCanAddStrokePoints = errors.New("only the drawer can add stroke points")
	ErrOnlyDrawerCanAddStrokes      = errors.New("only the drawer can add strokes")
	ErrOnlyDrawerCanClearStrokes    = errors.New("only the drawer can clear strokes")
	ErrOnlyDrawerCanUndoStroke      = errors.New("only the drawer can undo strokes")
)

type Stroke struct {
	Points [][]int `json:"points"`
	Color  string  `json:"color"` // hex color
	Width  int     `json:"width"`
	Type   string  `json:"type,omitempty"` // "brush" or "fill"
}

const (
	EndOfDrawingTimeDelay = 5 * time.Second
)

type DrawingState struct {
	currentWord Word
	hintedWord  string
	strokes     []Stroke

	endsAt time.Time

	pointsAwarded map[uuid.UUID]int
}

func NewDrawingState(word Word) RoomState {
	// Initialize the hinted word with blanks but preserve spaces
	wordRunes := []rune(word.Value)
	hintRunes := make([]rune, len(wordRunes))
	for i, r := range wordRunes {
		if r == ' ' || r == '-' {
			hintRunes[i] = r
		} else {
			hintRunes[i] = '*'
		}
	}

	return &DrawingState{
		currentWord:   word,
		strokes:       make([]Stroke, 0),
		hintedWord:    string(hintRunes),
		pointsAwarded: make(map[uuid.UUID]int),
	}
}

// Applies a new hint to the hinted word.
func (state *DrawingState) applyHint() {
	prevRunes := []rune(state.hintedWord)
	fullRunes := []rune(state.currentWord.Value)
	hiddenIndices := []int{}

	// Find all hidden letter positions
	for i, r := range prevRunes {
		if r == '*' {
			hiddenIndices = append(hiddenIndices, i)
		}
	}

	if len(hiddenIndices) == 0 {
		return
	}

	// Choose a random hidden position
	randomIndex := hiddenIndices[rand.Intn(len(hiddenIndices))]

	// Replace the star with the actual letter
	prevRunes[randomIndex] = fullRunes[randomIndex]

	state.hintedWord = string(prevRunes)
}

func (state *DrawingState) Enter(room *room) {
	state.endsAt = time.Now().Add(time.Second * time.Duration(room.Settings.DrawingTimeAllowed))

	room.broadcast(GameRoleGuessing,
		event(SetSelectedWordEvt, NewWord(state.hintedWord, state.currentWord.Difficulty)),
	)

	// If the game mode is not no hints, we start the hint routine
	if room.Settings.GameMode != GameModeNoHints {
		// Will apply up to 60% of the word length as hints
		totalHints := int(float64(len(state.currentWord.Value)) * 0.6)
		// Apply hints at a regular interval so the last hint is applied with one interval left
		hintInterval := time.Until(state.endsAt) / time.Duration(totalHints+1)
		// This will apply hints to the hinted word at a regular interval
		room.scheduler.addReccuringEvent(ScheduledHintReveal, hintInterval, totalHints, func() {
			state.applyHint()
			room.broadcast(GameRoleGuessing, event(SetSelectedWordEvt, NewWord(state.hintedWord, state.currentWord.Difficulty)))
		})
	}

	// Inform players of the phase change
	room.broadcast(GameRoleAny,
		event(SetCurrentStateEvt, Drawing),
		event(SetTimerEvt, state.endsAt.UTC()),
	)

	// Schedule the round end event
	room.scheduler.addEvent(ScheduledDrawingPhaseEnd, state.endsAt, func() {
		state.handleDrawingPhaseEnd(room)
	})
}

func (state *DrawingState) handleDrawingPhaseEnd(room *room) {
	room.scheduler.clearEvents()
	state.updateStreaks(room)
	room.currentDrawer.GameRole = GameRoleGuessing

	// Send drawing phase summary
	room.SendSystemMessage(state.drawingPhaseSummary(room))

	room.broadcast(GameRoleAny,
		event(SetSelectedWordEvt, state.currentWord),
		event(SetPlayersEvt, room.Players),
	)

	// Transition to the post drawing phase after a short delay
	room.scheduler.addEvent(ScheduledStateChange, time.Now().Add(EndOfDrawingTimeDelay), func() {
		room.Transition()
	})
}

func (state *DrawingState) Exit(room *room) {
	room.scheduler.clearEvents()

	room.setState(NewPostDrawingState(state.pointsAwarded))
}

func (state *DrawingState) drawingPhaseSummary(room *room) string {
	drawer := "A player"
	if room.currentDrawer != nil {
		drawer = room.currentDrawer.Username
	}

	word := state.currentWord.Value
	guessers := len(state.pointsAwarded)
	totalPlayers := len(room.Players)

	slog.Debug("Drawing phase summary",
		"drawer", drawer,
		"word", word,
		"guessers", guessers,
		"totalPlayers", totalPlayers,
	)

	switch {
	case guessers == totalPlayers:
		return fmt.Sprintf("%s sketched %s and everyone guessed it!", drawer, word)
	case guessers > 1:
		return fmt.Sprintf("%s sketched %s and %d %s guessed it.",
			drawer, word, guessers, pluralize(guessers, "player"))
	case guessers == 0:
		return fmt.Sprintf("%s sketched %s but nobody guessed it.", drawer, word)
	default:
		return fmt.Sprintf("%s sketched %s and 1 player guessed it.", drawer, word)
	}
}

// Helper function to handle pluralization
func pluralize(count int, word string) string {
	if count > 1 {
		return word + "s"
	}
	return word
}

func (state *DrawingState) updateStreaks(room *room) {
	playerPositions := getPlayerPositions(room.Players)

	// Update the streaks of all players and award them a streak bonus
	for _, p := range room.Players {
		state.updatePlayerStreak(p, room)
		state.awardStreakBonus(p, playerPositions[p.ID], len(room.Players))
	}
}

func (state *DrawingState) updatePlayerStreak(p *player, room *room) {
	if state.pointsAwarded[p.ID] > 0 {
		p.Streak++
		return
	}

	// Notify if a significant streak was lost
	if p.Streak >= 5 {
		room.SendSystemMessage(fmt.Sprintf("%s lost their streak of %d", p.Username, p.Streak))
	}
	p.Streak = 0
}

func (state *DrawingState) awardStreakBonus(p *player, position, totalPlayers int) {
	streakBonus := StreakBonus(position, totalPlayers, p.Streak)

	if streakBonus > 0 {
		state.pointsAwarded[p.ID] += streakBonus
		p.Score += streakBonus

		slog.Debug("Streak bonus awarded",
			"player", p.ID,
			"streak", p.Streak,
			"streakBonus", streakBonus,
			"playerPosition", position,
		)
	}
}

// Decodes the raw payload into a Stroke.
// Throws an error if the payload is not a valid Stroke.
func decodeStroke(payload interface{}) (Stroke, error) {
	stroke, err := decodePayload[Stroke](payload)
	if err != nil {
		slog.Warn("failed to decode stroke", "error", err)
		return Stroke{}, err
	}
	return stroke, nil
}

// Decodes the raw payload into a slice of integers.
// Throws an error if the payload is not a valid slice of integers.
func decodeStrokePoint(payload interface{}) ([]int, error) {
	point, err := decodePayload[[]int](payload)
	if err != nil {
		slog.Warn("failed to decode stroke point", "error", err)
		return []int{}, err
	}
	return point, nil
}

// Decodes a stroke point payload and appends it to the most recent stroke
func appendStrokePoint(strokes []Stroke, point []int) []Stroke {
	if len(strokes) == 0 {
		return strokes
	}
	strokes[len(strokes)-1].Points = append(strokes[len(strokes)-1].Points, point)
	return strokes
}

// Returns a new slice of strokes with the most recent stroke removed.
func removeLastStroke(strokes []Stroke) []Stroke {
	if len(strokes) > 0 {
		return strokes[:len(strokes)-1]
	}
	return strokes
}

func (state *DrawingState) isDrawingPhaseOver() bool {
	return time.Now().After(state.endsAt)
}

func (state *DrawingState) handleStroke(room *room, cmd *Command) error {
	if cmd.Player.ID != room.currentDrawer.ID {
		return ErrOnlyDrawerCanAddStrokes
	}

	if state.isDrawingPhaseOver() {
		return nil // Silently ignore strokes after drawing phase ends
	}

	// Decode the stroke from the payload
	stroke, err := decodeStroke(cmd.Payload)
	if err != nil {
		return fmt.Errorf("failed to decode stroke: %w", err)
	}

	// Add the stroke to the game state
	state.strokes = append(state.strokes, stroke)

	// Re-broadcast the stroke to the rest of the players
	room.broadcast(GameRoleGuessing,
		event(AddStrokeEvt, stroke),
	)

	return nil
}

func (state *DrawingState) handleStrokePoint(room *room, cmd *Command) error {
	if cmd.Player.ID != room.currentDrawer.ID {
		return ErrOnlyDrawerCanAddStrokePoints
	}

	if state.isDrawingPhaseOver() {
		return nil // Silently ignore stroke points after drawing phase ends
	}

	// Decode the stroke point from the payload
	point, err := decodeStrokePoint(cmd.Payload)
	if err != nil {
		return fmt.Errorf("failed to decode stroke point: %w", err)
	}

	// Add the stroke point to the most recent stroke
	state.strokes = appendStrokePoint(state.strokes, point)

	// Re-broadcast the stroke point to the rest of the players
	room.broadcast(GameRoleGuessing,
		event(AddStrokePointEvt, point),
	)

	return nil
}

func (state *DrawingState) handleClearStrokes(room *room, cmd *Command) error {
	if cmd.Player.ID != room.currentDrawer.ID {
		return ErrOnlyDrawerCanClearStrokes
	}

	if state.isDrawingPhaseOver() {
		return nil // Silently ignore clear strokes after drawing phase ends
	}

	// Clear the strokes from the game state
	state.strokes = make([]Stroke, 0)

	// Tell the other players to clear their strokes
	room.broadcast(GameRoleGuessing,
		event(ClearStrokesEvt, nil),
	)
	return nil
}

func (state *DrawingState) handleUndoStroke(room *room, cmd *Command) error {
	if cmd.Player.ID != room.currentDrawer.ID {
		return ErrOnlyDrawerCanUndoStroke
	}

	if state.isDrawingPhaseOver() {
		return nil // Silently ignore undo stroke after drawing phase ends
	}

	// Remove the most recent stroke from the game state
	state.strokes = removeLastStroke(state.strokes)

	// Tell the other players to undo their last stroke
	room.broadcast(GameRoleGuessing,
		event(UndoStrokeEvt, nil),
	)
	return nil
}

func (state *DrawingState) handlePlayerLeft(room *room, cmd *Command) error {
	delete(state.pointsAwarded, cmd.Player.ID)

	return nil
}

func (state *DrawingState) handlePlayerJoined(room *room, cmd *Command) error {
	player := cmd.Player

	room.enqueueDrawingPlayer(player)
	player.Send(
		event(SetStrokesEvt, state.strokes),
		event(SetSelectedWordEvt, NewWord(state.hintedWord, state.currentWord.Difficulty)),
		event(SetCurrentStateEvt, Drawing),
		event(SetTimerEvt, state.endsAt.UTC()),
	)

	return nil
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
func isGuessClose(guess string, currentWord Word) bool {
	distance := levenshteinDistance(guess, currentWord.Value)
	// Allow up to 1/3 of the word length to be different
	maxDistance := len(currentWord.Value) / 3

	return distance <= maxDistance
}

func (state *DrawingState) handleChatMessage(room *room, cmd *Command) error {
	if state.isDrawingPhaseOver() {
		return fmt.Errorf("round is over") // Silently ignore chat messages after drawing phase ends
	}

	player := cmd.Player
	chatValue := cmd.Payload.(string)
	msg := ChatMessage{
		ID:       uuid.New(),
		PlayerID: player.ID,
		Content:  chatValue,
		Type:     ChatMessageTypeDefault,
	}

	chatValue = sanitizeChatMessage(chatValue)

	// If the player is not drawing and hasn't guessed correctly yet
	if room.currentDrawer.ID != player.ID && state.pointsAwarded[player.ID] == 0 {
		// Check if the guess is exactly correct
		if strings.EqualFold(chatValue, state.currentWord.Value) {
			guesserPoints, drawerPoints := GuessPoints(len(room.Players)-1, len(state.pointsAwarded), state.currentWord.Difficulty)

			// Update the guesser's points
			state.pointsAwarded[player.ID] = guesserPoints
			player.Score += guesserPoints

			// Update the drawer's points and the correct guesser's points
			state.pointsAwarded[room.currentDrawer.ID] += drawerPoints
			room.currentDrawer.Score += drawerPoints

			msg.Type = ChatMessageTypeCorrect
			msg.Content = "" // Dont leak the correct answer to the other players

			player.Send(event(SetSelectedWordEvt, state.currentWord))
		} else if isGuessClose(chatValue, state.currentWord) {
			// If the guess is close, show a different message in chat
			msg.Type = ChatMessageTypeCloseGuess
		}
	}

	room.handleChatMessage(msg)

	// if all players have guessed correctly, end the drawing phase
	if len(state.pointsAwarded) >= len(room.Players) {
		room.scheduler.clearEvents()
		state.endsAt = time.Now()
		state.handleDrawingPhaseEnd(room)
	}

	return nil
}

func (state *DrawingState) HandleCommand(room *room, cmd *Command) error {
	switch cmd.Type {
	case AddStrokePointCmd:
		return state.handleStrokePoint(room, cmd)
	case ChatMessageCmd:
		return state.handleChatMessage(room, cmd)
	case AddStrokeCmd:
		return state.handleStroke(room, cmd)
	case ClearStrokesCmd:
		return state.handleClearStrokes(room, cmd)
	case UndoStrokeCmd:
		return state.handleUndoStroke(room, cmd)
	case PlayerLeftCmd:
		return state.handlePlayerLeft(room, cmd)
	case PlayerJoinedCmd:
		return state.handlePlayerJoined(room, cmd)
	default:
		slog.Error("Invalid action for current state", "action", cmd.Type)
		return ErrInvalidEvent
	}
}
