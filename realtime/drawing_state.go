package main

import (
	"fmt"
	"log/slog"
	"math/rand"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Stroke struct {
	Points [][]int `json:"points"`
	Color  string  `json:"color"` // hex color
	Width  int     `json:"width"`
	Type   string  `json:"type,omitempty"` // "brush" or "fill"
}

type DrawingState struct {
	currentWord Word
	hintedWord  string
	strokes     []Stroke

	correctGuessers map[uuid.UUID]bool // ! can we just combine these two things ?
	pointsAwarded   map[uuid.UUID]int
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
		currentWord:     word,
		strokes:         make([]Stroke, 0),
		hintedWord:      string(hintRunes),
		correctGuessers: make(map[uuid.UUID]bool),
		pointsAwarded:   make(map[uuid.UUID]int),
	}
}

// Applies a new hint to the hinted word.
func (state DrawingState) applyHint() {
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

func (state DrawingState) Enter(room *room) {
	phaseDuration := time.Duration(room.Settings.DrawingTimeAllowed) * time.Second

	room.broadcast(GameRoleGuessing,
		event(SetSelectedWordEvt, state.hintedWord),
	)

	// If the game mode is not no hints, we start the hint routine
	if room.Settings.GameMode != GameModeNoHints {
		// Will apply up to 60% of the word length as hints
		totalHints := int(float64(len(state.currentWord.Value)) * 0.6)
		// Apply hints at a regular interval so the last hint is applied with one interval left
		hintInterval := phaseDuration / time.Duration(totalHints+1)
		// This will apply hints to the hinted word at a regular interval
		room.scheduler.addReccuringEvent(ScheduledHintReveal, hintInterval, totalHints, func() {
			state.applyHint()
			room.broadcast(GameRoleGuessing, event(SetSelectedWordEvt, state.hintedWord))
		})
	}

	// Inform players of the phase change
	room.broadcast(GameRoleAny,
		event(SetCurrentStateEvt, Drawing),
		event(SetTimerEvt, time.Now().Add(phaseDuration).UTC()),
	)

	room.scheduler.addEvent(ScheduledStateChange, time.Now().Add(phaseDuration), func() {
		room.Transition()
	})
}

func (state DrawingState) Exit(room *room) {
	room.scheduler.cancelEvent(ScheduledStateChange)

	// Reveal the word
	state.hintedWord = state.currentWord.Value

	room.broadcast(GameRoleAny,
		event(SetSelectedWordEvt, state.hintedWord),
		event(SetCurrentStateEvt, PostDrawing),
	)

	var msg string
	drawerName := "A player"

	if room.currentDrawer != nil {
		drawerName = room.currentDrawer.Username
	}

	if len(state.correctGuessers) == (len(room.Players) - 1) {
		msg = fmt.Sprintf("%s sketched %s and everyone guessed it!", drawerName, state.hintedWord)
	} else if len(state.correctGuessers) > 0 {
		playersStr := "player"
		if len(state.correctGuessers) > 1 {
			playersStr = "players"
		}
		msg = fmt.Sprintf("%s sketched %s and %d %s guessed it.", drawerName, state.hintedWord, len(state.correctGuessers), playersStr)
	} else if len(state.correctGuessers) == 0 {
		msg = fmt.Sprintf("%s sketched %s but nobody guessed it.", drawerName, state.hintedWord)
	} else {
		msg = fmt.Sprintf("%s sketched %s", drawerName, state.hintedWord)
	}

	room.SendSystemMessage(msg)

	playerPositions := getPlayerPositions(room.Players)

	// Update the streaks of all players and award them a streak bonus
	for _, p := range room.Players {
		if state.correctGuessers[p.ID] {
			// If the player guessed correctly, increment their streak
			p.Streak++
		} else if room.currentDrawer != nil && p.ID == room.currentDrawer.ID && len(state.correctGuessers) > 0 {
			// If the player is the drawer and at least one person guessed correctly, increment their streak
			p.Streak++
		} else {
			// If the player lost their streak, show a message in chat
			if p.Streak >= 5 {
				room.SendSystemMessage(fmt.Sprintf("%s lost their streak of %d", p.Username, p.Streak))
			}

			// Otherwise, reset the streak
			p.Streak = 0
		}

		// Award them a streak bonus
		streakBonus := StreakBonus(playerPositions[p.ID], len(room.Players), p.Streak)
		state.pointsAwarded[p.ID] += streakBonus
		p.Score += streakBonus

		slog.Debug("Streak bonus awarded", "player", p.ID, "streak", p.Streak, "streakBonus", streakBonus, "playerPosition", playerPositions[p.ID])
	}

	// Inform players of the state changes
	room.broadcast(GameRoleAny,
		event(SetPlayersEvt, room.Players),
	)

	// Show a message in chat if the lead changes
	leadChange := CheckLeadChange(state.pointsAwarded, room.Players)
	if leadChange != "" {
		room.SendSystemMessage(leadChange)
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

// Returns a new empty slice of strokes.
func emptyStrokeSlice() []Stroke {
	return make([]Stroke, 0)
}

// Returns a new slice of strokes with the most recent stroke removed.
func removeLastStroke(strokes []Stroke) []Stroke {
	if len(strokes) > 0 {
		return strokes[:len(strokes)-1]
	}
	return strokes
}

func (state DrawingState) handleStroke(room *room, cmd *Command) error {
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

func (state DrawingState) handleStrokePoint(room *room, cmd *Command) error {
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

func (state DrawingState) handleClearStrokes(room *room, cmd *Command) error {
	// Clear the strokes from the game state
	state.strokes = make([]Stroke, 0)

	// Tell the other players to clear their strokes
	room.broadcast(GameRoleGuessing,
		event(ClearStrokesEvt, nil),
	)
	return nil
}

func (state DrawingState) handleUndoStroke(room *room, cmd *Command) error {
	// Remove the most recent stroke from the game state
	state.strokes = removeLastStroke(state.strokes)

	// Tell the other players to undo their last stroke
	room.broadcast(GameRoleGuessing,
		event(UndoStrokeEvt, nil),
	)
	return nil

}

func (state DrawingState) handlePlayerLeft(room *room, cmd *Command) error {
	// Remove the player from the correct guessers map and points awarded map.
	// This is necessary because the guessers map is used to determine if all
	// guessing players have guessed correctly.
	if _, ok := state.correctGuessers[cmd.Player.ID]; ok {
		delete(state.correctGuessers, cmd.Player.ID)
	}
	if _, ok := state.pointsAwarded[cmd.Player.ID]; ok {
		delete(state.pointsAwarded, cmd.Player.ID)
	}

	if cmd.Player.GameRole == GameRoleDrawing || len(state.correctGuessers) >= len(room.Players)-2 {
		// TODO: cancel the event
		room.Transition()
	}

	return nil
}

func (state DrawingState) handlePlayerJoined(room *room, cmd *Command) error {
	player := cmd.Player

	room.enqueueDrawingPlayer(player)
	player.Send(
		event(SetStrokesEvt, state.strokes),
		event(SetSelectedWordEvt, state.hintedWord),
		event(SetCurrentStateEvt, Drawing),
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

func (state DrawingState) handleChatMessage(room *room, cmd *Command) error {
	player := cmd.Player
	guessValue := cmd.Payload.(string)

	playerIsNotDrawing := room.currentDrawer.ID != player.ID
	playerHasNotAlreadyGuessedCorrectly := !state.correctGuessers[player.ID]

	if playerIsNotDrawing && playerHasNotAlreadyGuessedCorrectly {
		var result ChatMessage

		// Check if the guess is correct if the player is not drawing and hasn't guessed correctly yet
		if strings.EqualFold(guessValue, state.currentWord.Value) {
			guesserPoints, drawerPoints := GuessPoints(len(room.Players)-1, len(state.correctGuessers), state.currentWord.Difficulty)

			// Update the guesser's points
			state.pointsAwarded[player.ID] = guesserPoints
			player.Score += guesserPoints
			state.correctGuessers[player.ID] = true

			// Update the drawer's points
			state.pointsAwarded[room.currentDrawer.ID] += drawerPoints
			room.currentDrawer.Score += drawerPoints

			result = ChatMessage{
				ID:            uuid.New(),
				PlayerID:      player.ID,
				Guess:         "", // Dont leak the correct word to the other players
				IsCorrect:     true,
				PointsAwarded: guesserPoints,
			}
			player.Send(event(SetSelectedWordEvt, state.currentWord.Value))
		} else {
			result = ChatMessage{
				ID:       uuid.New(),
				PlayerID: player.ID,
				Guess:    guessValue,
			}

			if playerIsNotDrawing && !playerHasNotAlreadyGuessedCorrectly {
				result.IsClose = isGuessClose(strings.ToLower(guessValue), state.currentWord)
			}
		}

		// Tell the other players about the guess
		room.ChatMessages = append(room.ChatMessages, result)
		room.broadcast(GameRoleAny, event(NewChatMessageEvt, result))

		// Skip to the next phase if everyone has guessed correctly already
		if len(state.correctGuessers) >= len(room.Players)-1 {
			room.Transition()
		}
	}

	return nil
}

// ! ordered by most likely to be called
func (state DrawingState) HandleCommand(room *room, cmd *Command) error {
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
