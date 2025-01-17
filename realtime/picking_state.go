package main

import (
	"fmt"
	"log/slog"
	"math/rand"
)

type PickingState struct {
	wordOptions  []Word
	selectedWord *Word
}

func NewPickingState(wordOptions []Word) RoomState {
	return PickingState{
		wordOptions:  wordOptions,
		selectedWord: nil,
	}
}

func (state PickingState) Enter(room *room) {
	nextDrawer := room.getNextDrawingPlayer()

	// If the queue is empty, we're at the end of a round
	// OR the beginning of a new game
	if nextDrawer == nil {
		// It's the last round, return to waiting state
		if room.CurrentRound >= room.Settings.TotalRounds {
			room.TransitionTo(NewWaitingState())
			return
		}

		// Otherwise, increment the round and refill the queue
		room.CurrentRound++
		room.fillDrawingQueue()
		nextDrawer = room.getNextDrawingPlayer()

		if nextDrawer == nil {
			// TODO: idk if this can happen, maybe a race condition with a player leaving?
			// what should we do here?
			return
		}
	}

	// TODO: scheduling stuff and timer events

	// ! remove this
	// evt := scheudleEvent(end of state time) ??
	// room.scheduler.addEvent(evt) ??
	// broadcast(changeTimer evt.getUTC) ??

	nextDrawer.GameRole = GameRoleDrawing
	nextDrawer.Send(
		event(SetWordOptionsEvt, state.wordOptions),
	)

	room.broadcast(GameRoleAny,
		event(SetCurrentStateEvt, Picking),
		event(SetPlayersEvt, room.Players),
		event(SetCurrentRoundEvt, room.CurrentRound),
		event(SetSelectedWordEvt, ""),
	)
}

func (state PickingState) Exit(room *room) {
	// If the player never choose a word, we pick one for them
	if state.selectedWord == nil {
		// Select a random word from the options
		randomIndex := rand.Intn(len(state.wordOptions) - 1)
		state.selectedWord = &state.wordOptions[randomIndex]

		// Notify all players of the chosen word
		room.broadcast(GameRoleAny, event(SetSelectedWordEvt, state.selectedWord.Value))
	}

	room.setState(NewDrawingState(*state.selectedWord))
}

func (state PickingState) handleWordSelection(room *room, cmd *Command) error {
	if cmd.Player.GameRole != GameRoleDrawing {
		return ErrWrongGameRole
	}

	// Check if selected word is actually an option
	selectedWord := cmd.Payload.(string)
	var foundDrawingWord *Word
	for _, option := range state.wordOptions {
		if option.Value == selectedWord {
			foundDrawingWord = &option
			break
		}
	}
	if foundDrawingWord == nil {
		return fmt.Errorf("selected word is not a valid option")
	}

	state.selectedWord = foundDrawingWord
	room.Transition()

	return nil
}

func (state PickingState) HandleCommand(room *room, cmd *Command) error {
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

func (state PickingState) handlePlayerLeft(room *room, cmd *Command) error {
	// Handle phase transitions if the player that left was the drawer
	if cmd.Player.GameRole == GameRoleDrawing {
		room.TransitionTo(NewPickingState(state.wordOptions))
	}
	return nil
}

func (state PickingState) handlePlayerJoined(room *room, cmd *Command) error {
	player := cmd.Player

	room.enqueueDrawingPlayer(player)
	player.Send(
		event(SetCurrentStateEvt, Picking),
	)
	return nil
}
