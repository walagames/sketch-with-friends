package main

import (
	"fmt"
	"log/slog"
)

// WaitingState handles the pre-game lobby where players wait to start
type WaitingState struct{}

// NewWaitingState creates a new WaitingState
func NewWaitingState() RoomState {
	return &WaitingState{}
}

// Enter broadcasts the current state and players to all clients
func (state *WaitingState) Enter(room *room) {
	room.broadcast(GameRoleAny,
		event(SetCurrentStateEvt, Waiting),
		event(SetPlayersEvt, room.Players),
	)
}

// Exit moves the room to picking state with random word options
func (state *WaitingState) Exit(room *room) {
	room.setState(
		NewPickingState(
			randomWordOptions(3,
				room.Settings.WordDifficulty,
				room.Settings.CustomWords,
			),
		),
	)
}

// HandleCommand routes commands to their appropriate handlers
func (state *WaitingState) HandleCommand(room *room, cmd *Command) error {
	switch cmd.Type {
	case StartGameCmd:
		return state.handleGameStart(room, cmd)
	case ChangeRoomSettingsCmd:
		return state.handleRoomSettingsChange(room, cmd)
	case PlayerJoinedCmd:
		return state.handlePlayerJoined(room, cmd)
	case ChatMessageCmd:
		return state.handleChatMessage(room, cmd)
	default:
		slog.Error("Invalid command for current state", "command", cmd.Type)
		return ErrInvalidCommand
	}
}

// handleGameStart checks if game can start and initiates it
func (state *WaitingState) handleGameStart(room *room, cmd *Command) error {
	if len(room.Players) < 2 {
		return ErrNotEnoughPlayers
	}
	if len(room.Settings.CustomWords) < 3 && room.Settings.WordBank == WordBankCustom {
		return ErrNotEnoughCustomWords
	}
	if cmd.Player.RoomRole != RoomRoleHost {
		return ErrWrongRoomRole
	}

	room.resetGameState()
	room.Transition()
	return nil
}

// handleRoomSettingsChange updates room settings if valid
func (state *WaitingState) handleRoomSettingsChange(room *room, cmd *Command) error {
	if cmd.Player.RoomRole != RoomRoleHost {
		return ErrWrongRoomRole
	}

	settings, err := decodePayload[RoomSettings](cmd.Payload)
	if err != nil {
		slog.Error("failed to decode room settings", "error", err)
		return fmt.Errorf("failed to decode room settings: %w", err)
	}

	// Validate the settings before applying them
	if err := validateRoomSettings(&settings); err != nil {
		slog.Error("invalid room settings", "error", err)
		return fmt.Errorf("invalid room settings: %w", err)
	}

	room.Settings = settings

	// Inform clients of the room settings change
	room.broadcast(GameRoleAny,
		event(ChangeRoomSettingsEvt, room.Settings),
	)
	return nil
}

// handlePlayerJoined sends current state to new players
func (state *WaitingState) handlePlayerJoined(room *room, cmd *Command) error {
	cmd.Player.Send(
		event(SetCurrentStateEvt, Waiting),
	)
	return nil
}

// handleChatMessage broadcasts new chat messages to all players
func (state *WaitingState) handleChatMessage(room *room, cmd *Command) error {
	msg := ChatMessage{
		PlayerID: cmd.Player.ID,
		Content:  cmd.Payload.(string),
		Type:     ChatMessageTypeDefault,
	}
	room.ChatMessages = append(room.ChatMessages, msg)

	room.broadcast(GameRoleAny,
		event(NewChatMessageEvt, msg),
	)
	return nil
}
