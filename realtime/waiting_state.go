package main

import (
	"fmt"
	"log/slog"
)

type WaitingState struct{}

func NewWaitingState() *WaitingState {
	return &WaitingState{}
}

func (state *WaitingState) Enter(room *room) {
	room.broadcast(GameRoleAny,
		event(SetCurrentStateEvt, Waiting),
		event(SetPlayersEvt, room.Players), // ! idk if this is needed
	)
}

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

func (state *WaitingState) handlePlayerJoined(room *room, cmd *Command) error {
	cmd.Player.Send(
		event(SetCurrentStateEvt, Waiting),
	)
	return nil
}

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
