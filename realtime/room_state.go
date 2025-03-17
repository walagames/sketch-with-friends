package main

import (
	"errors"
)

// Game state constants representing different phases of the game
const (
	Waiting     = 100 // Initial state when waiting for players
	Picking     = 200 // State when players are picking words/options
	Drawing     = 201 // State when active player is drawing
	PostDrawing = 202 // State after drawing is complete
	GameOver    = 203 // State when the game has ended
)

// Error definitions for invalid player actions
var ErrWrongRoomRole = errors.New("player does not have the correct room role to perform this action")
var ErrWrongGameRole = errors.New("player does not have the correct game role to perform this action")

// RoomState defines the interface for different game states
// Each state implements its own behavior for entering, exiting,
// and handling commands
type RoomState interface {
	// Enter is called when transitioning into this state
	Enter(room *room)

	// Exit is called when transitioning out of this state
	Exit(room *room)

	// HandleCommand processes incoming commands based on the current state
	// Returns an error if the command cannot be handled
	HandleCommand(room *room, cmd *Command) error
}
