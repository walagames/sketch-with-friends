package main

import (
	"fmt"
	"log/slog"
	"math/rand"
	"time"
)

type PickingState struct {
	wordOptions  []Word
	selectedWord *Word
	endsAt       time.Time
}

func NewPickingState(wordOptions []Word) RoomState {
	return &PickingState{
		wordOptions:  wordOptions,
		selectedWord: nil,
		endsAt:       time.Now().Add(time.Second * 15),
	}
}

func (state *PickingState) Enter(room *room) {
	slog.Debug("ENTERING PICKING STATE")
	nextDrawer := room.getNextDrawingPlayer()

	// If the queue is empty, we're at the end of a round
	// OR the beginning of a new game
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
			slog.Error("drawer was nil twice")
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

	room.currentDrawer = nextDrawer
	nextDrawer.GameRole = GameRoleDrawing
	nextDrawer.Send(
		event(SetWordOptionsEvt, state.wordOptions),
	)

	// room.scheduler.cancelEvent(ScheduledStateChange)
	slog.Debug("adding scheduled state change event")
	room.scheduler.addEvent(ScheduledStateChange, state.endsAt, func() {
		slog.Debug("CALLING FUNCTION")
		room.Transition()
	})

	room.broadcast(GameRoleAny,
		event(SetCurrentStateEvt, Picking),
		event(SetPlayersEvt, room.Players),
		event(SetCurrentRoundEvt, room.CurrentRound),
		event(SetSelectedWordEvt, nil),
		event(SetTimerEvt, state.endsAt.UTC()),
	)

}

func (state *PickingState) Exit(room *room) {
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

	// room.broadcast(GameRoleGuessing, event(SetSelectedWordEvt, state.selectedWord.Value))
	room.setState(NewDrawingState(*state.selectedWord))
}

func (state *PickingState) handleWordSelection(room *room, cmd *Command) error {
	if cmd.Player.GameRole != GameRoleDrawing {
		slog.Debug("player is not the drawer", "player", cmd.Player.ID)
		return ErrWrongGameRole
	}

	wordMap := cmd.Payload.(map[string]interface{})
	selectedWord := Word{
		Value: wordMap["value"].(string),
	}

	slog.Debug("player selected word", "word", selectedWord.Value)

	var foundDrawingWord *Word
	for _, option := range state.wordOptions {
		if option.Value == selectedWord.Value {
			slog.Debug("found drawing word", "word", option.Value)
			foundDrawingWord = &option
			break
		}
	}
	if foundDrawingWord == nil {
		slog.Error("selected word is not a valid option", "word", selectedWord.Value)
		return fmt.Errorf("selected word is not a valid option")
	}

	state.selectedWord = foundDrawingWord

	room.scheduler.cancelEvent(ScheduledStateChange)
	room.Transition()

	return nil
}

func (state *PickingState) handlePlayerLeft(room *room, cmd *Command) error {
	// Handle phase transitions if the player that left was the drawer
	if cmd.Player.GameRole == GameRoleDrawing {
		room.TransitionTo(NewPickingState(state.wordOptions))
	}
	return nil
}

func (state *PickingState) handlePlayerJoined(room *room, cmd *Command) error {
	player := cmd.Player

	room.enqueueDrawingPlayer(player)
	player.Send(
		event(SetCurrentStateEvt, Picking),
		event(SetTimerEvt, state.endsAt.UTC()),
	)
	return nil
}

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
