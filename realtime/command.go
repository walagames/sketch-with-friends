package main

import (
	"encoding/json"
	"errors"
	"log/slog"

	"github.com/mitchellh/mapstructure"
)

var (
	ErrGameNotInitialized = errors.New("game is not initialized")

	ErrInvalidChatMessage = errors.New("invalid chat message")

	ErrNotInRoomScene    = errors.New("game must be in room scene to perform this action")
	ErrNotInPickingScene = errors.New("game must be in picking scene to perform this  action")
	ErrNotInDrawingScene = errors.New("game must be in drawing scene to perform this action")

	ErrNotEnoughPlayers     = errors.New("you need at least 2 players to start the game")
	ErrNotEnoughCustomWords = errors.New("you need to provide at least 3 custom words in custom only mode")
	ErrWordAlreadySelected  = errors.New("word already selected")

	ErrInvalidCommand = errors.New("invalid or unhandled command")
)

type CommandType string

const (
	AddStrokeCmd      CommandType = "canvas/addStroke"
	AddStrokePointCmd CommandType = "canvas/addStrokePoint"
	ClearStrokesCmd   CommandType = "canvas/clearStrokes"
	UndoStrokeCmd     CommandType = "canvas/undoStroke"

	ChatMessageCmd CommandType = "room/newChatMessage"
	SelectWordCmd  CommandType = "game/selectWord"
	StartGameCmd   CommandType = "game/start"

	ChangeRoomSettingsCmd  CommandType = "room/changeSettings"
	UpdatePlayerProfileCmd CommandType = "room/updatePlayerProfile"

	PlayerLeftCmd   CommandType = "room/playerLeft"
	PlayerJoinedCmd CommandType = "room/playerJoined"
)

// Command represents an action sent from a client to the server.
type Command struct {
	Type    CommandType `json:"type"`
	Payload interface{} `json:"payload"`
	Player  *player     `json:"-"` // the player that sent the command
}

// Decode a JSON byte slice into a command
func decodeCommand(bytes []byte) (*Command, error) {
	var command *Command
	err := json.Unmarshal(bytes, &command)
	if err != nil {
		slog.Error("error unmarshalling command", "error", err)
		return nil, err
	}
	return command, nil
}

// Decode a command payload into a target type
func decodePayload[T any](payload interface{}) (T, error) {
	var target T
	err := mapstructure.Decode(payload, &target)
	if err != nil {
		slog.Debug("failed to decode payload", "error", err)
		return target, err
	}
	return target, nil
}

// Check if a command is a stroke command
//
// Used to determine if we should ignore the client rate limiter
func (c *Command) isStrokeCommand() bool {
	return c.Type == AddStrokePointCmd || c.Type == AddStrokeCmd || c.Type == UndoStrokeCmd || c.Type == ClearStrokesCmd
}
