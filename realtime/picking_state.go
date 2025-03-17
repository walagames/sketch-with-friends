package main

import (
	"fmt"
	"log/slog"
	"math/rand"
	"time"
)

// PickingState represents the game state where a player is selecting a word to draw
type PickingState struct {
	wordOptions  []Word    // List of possible words the player can choose from
	selectedWord *Word     // The word that was selected (nil until selection is made)
	endsAt       time.Time // When this state should automatically end
}

// NewPickingState creates a new picking state with the given word options
func NewPickingState(wordOptions []Word) RoomState {
	return &PickingState{
		wordOptions:  wordOptions,
		selectedWord: nil,
		endsAt:       time.Now().Add(time.Second * 15),
	}
}

// Enter is called when the game enters the picking state
func (state *PickingState) Enter(room *room) {
	nextDrawer := room.getNextDrawingPlayer()

	// Handle end of round or new game scenarios
	if nextDrawer == nil {
		slog.Debug("queue is empty, checking if we're at the end of a round")
		// It's the last round, return to waiting state
		if room.CurrentRound >= room.Settings.TotalRounds {
			slog.Debug("it's the last round, returning to waiting state")
			room.TransitionTo(NewWaitingState())
			return
		}

		// Otherwise, increment the round and refill the queue
		room.CurrentRound++
		room.fillDrawingQueue()
		nextDrawer = room.getNextDrawingPlayer()

		if nextDrawer == nil {
			return
		}
	}

	// Set up the new drawer and send them the word options
	room.currentDrawer = nextDrawer
	nextDrawer.GameRole = GameRoleDrawing
	nextDrawer.Send(
		event(SetWordOptionsEvt, state.wordOptions),
	)

	// Schedule automatic state transition if time runs out
	room.scheduler.addEvent(ScheduledStateChange, state.endsAt, func() {
		room.Transition()
	})

	// Broadcast the new game state to all players
	room.broadcast(GameRoleAny,
		event(SetCurrentStateEvt, Picking),
		event(SetPlayersEvt, room.Players),
		event(SetCurrentRoundEvt, room.CurrentRound),
		event(SetSelectedWordEvt, nil),
		event(SetTimerEvt, state.endsAt.UTC()),
	)

}

// Exit is called when leaving the picking state
func (state *PickingState) Exit(room *room) {
	// Cancel the scheduled auto-transition
	room.scheduler.cancelEvent(ScheduledStateChange)
	// If the player never choose a word, we pick one for them
	if state.selectedWord == nil {
		slog.Debug("no word selected, picking a random word")
		// Select a random word from the options
		randomIndex := rand.Intn(len(state.wordOptions) - 1)
		state.selectedWord = &state.wordOptions[randomIndex]

		// Notify all players of the chosen word
		room.currentDrawer.Send(
			event(SetSelectedWordEvt, state.selectedWord),
		)
	}

	room.setState(NewDrawingState(*state.selectedWord))
}

// SafeExtractWord attempts to extract a Word from a command payload
func SafeExtractWord(payload interface{}) (*Word, error) {
	wordMap, ok := payload.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid payload format: expected map[string]interface{}")
	}

	value, ok := wordMap["value"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid word format: 'value' field must be a string")
	}

	if value == "" {
		return nil, fmt.Errorf("invalid word: value cannot be empty")
	}

	return &Word{Value: value}, nil
}

// handleWordSelection processes a player's word choice
func (state *PickingState) handleWordSelection(room *room, cmd *Command) error {
	// Verify the player is actually the drawer
	if cmd.Player.GameRole != GameRoleDrawing {
		slog.Debug("player is not the drawer", "player", cmd.Player.ID)
		return ErrWrongGameRole
	}

	// Extract and validate the selected word
	selectedWord, err := SafeExtractWord(cmd.Payload)
	if err != nil {
		slog.Error("failed to extract word from payload", "error", err)
		return fmt.Errorf("invalid word selection: %w", err)
	}

	// Verify the selected word is one of the valid options
	var foundDrawingWord *Word
	for _, option := range state.wordOptions {
		if option.Value == selectedWord.Value {
			foundDrawingWord = &option
			break
		}
	}
	if foundDrawingWord == nil {
		slog.Error("selected word is not a valid option", "word", selectedWord.Value)
		return fmt.Errorf("selected word is not a valid option")
	}

	state.selectedWord = foundDrawingWord

	// Cancel the auto-transition and move to next state
	room.scheduler.cancelEvent(ScheduledStateChange)
	room.Transition()

	return nil
}

// handlePlayerLeft handles when a player leaves during the picking state
func (state *PickingState) handlePlayerLeft(room *room, cmd *Command) error {
	// If the drawer leaves, restart the picking state
	if cmd.Player.GameRole == GameRoleDrawing {
		room.TransitionTo(NewPickingState(state.wordOptions))
	}
	return nil
}

// handlePlayerJoined handles when a new player joins during the picking state
func (state *PickingState) handlePlayerJoined(room *room, cmd *Command) error {
	// Send the current game state to the new player
	cmd.Player.Send(
		event(SetCurrentStateEvt, Picking),
		event(SetTimerEvt, state.endsAt.UTC()),
	)
	return nil
}

// HandleCommand routes and processes incoming commands for this state
func (state *PickingState) HandleCommand(room *room, cmd *Command) error {
	switch cmd.Type {
	case SelectWordCmd:
		return state.handleWordSelection(room, cmd)
	case PlayerLeftCmd:
		return state.handlePlayerLeft(room, cmd)
	case PlayerJoinedCmd:
		return state.handlePlayerJoined(room, cmd)
	default:
		slog.Error("Invalid command for current state", "command", cmd.Type)
		return ErrInvalidCommand
	}
}
