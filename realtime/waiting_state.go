package main

import (
	"fmt"
	"log/slog"
)

type WaitingState struct{}

func NewWaitingState() RoomState {
	return WaitingState{}
}

func (state WaitingState) Enter(room *room) {
	room.broadcast(GameRoleAny,
		event(SetCurrentStateEvt, Waiting),
		event(SetPlayersEvt, room.Players), // ! idk if this is needed
	)
}

func (state WaitingState) Exit(room *room) {
	room.setState(
		NewPickingState(
			randomWordOptions(3,
				room.Settings.WordDifficulty,
				room.Settings.CustomWords,
			),
		),
	)
}

func (state WaitingState) HandleCommand(room *room, cmd *Command) error {
	switch cmd.Type {
	case StartGameCmd:
		return state.handleGameStart(room, cmd)
	case ChangeRoomSettingsCmd:
		return state.handleRoomSettingsChange(room, cmd)
	case ChangePlayerProfileCmd:
		return state.handlePlayerProfileChange(room, cmd)
	case PlayerJoinedCmd:
		return state.handlePlayerJoined(room, cmd)
	default:
		slog.Error("Invalid command for current state", "command", cmd.Type)
		return ErrInvalidCommand
	}
}

func (state WaitingState) handleGameStart(room *room, cmd *Command) error {
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

func (state WaitingState) handleRoomSettingsChange(room *room, cmd *Command) error {
	settings, err := decodePayload[RoomSettings](cmd.Payload)
	if err != nil {
		return fmt.Errorf("failed to decode room settings: %w", err)
	}

	// Validate the settings before applying them
	if err := validateRoomSettings(&settings); err != nil {
		return fmt.Errorf("invalid room settings: %w", err)
	}

	room.Settings = settings

	// Inform clients of the room settings change
	room.broadcast(GameRoleAny,
		event(ChangeRoomSettingsEvt, room.Settings),
	)
	return nil
}

type PlayerProfileChange struct {
	Username     string        `json:"username"`
	AvatarConfig *AvatarConfig `json:"avatarConfig"`
}

func (state WaitingState) handlePlayerProfileChange(room *room, cmd *Command) error {
	// Decode the payload
	profile, err := decodePayload[PlayerProfileChange](cmd.Payload)
	if err != nil {
		return fmt.Errorf("invalid player profile payload: %w", err)
	}

	// Validate and sanitize the profile
	validatedProfile, err := validatePlayerProfile(&profile)
	if err != nil {
		return fmt.Errorf("profile validation failed: %w", err)
	}

	// Show join message if new player
	if profile.Username == "" {
		room.SendSystemMessage(fmt.Sprintf("%s joined the room", validatedProfile.Username))
	}

	// Update the player's profile with validated data
	cmd.Player.Username = validatedProfile.Username
	cmd.Player.AvatarConfig = validatedProfile.AvatarConfig

	// Broadcast the change to all players
	room.broadcast(GameRoleAny,
		event(SetPlayersEvt, room.Players),
	)
	return nil
}

func (state WaitingState) handlePlayerJoined(room *room, cmd *Command) error {
	cmd.Player.Send(
		event(SetCurrentStateEvt, Waiting),
	)
	return nil
}
