package main

import (
	"errors"
)

const (
	// Room states (0-99)
	Waiting = 0

	// Game states (100-199)
	Picking     = 100
	Drawing     = 101
	PostDrawing = 102

	// End game states (200-299)
	GameOver = 200
)

var ErrWrongRoomRole = errors.New("player does not have the correct room role to perform this action")
var ErrWrongGameRole = errors.New("player does not have the correct game role to perform this action")

type RoomState interface {
	Enter(room *room)
	Exit(room *room)

	HandleCommand(room *room, cmd *Command) error
}

// Helper functions to check if the game is in a playing state
func isPlaying(state RoomState) bool {
	_, isWaiting := state.(*WaitingState)
	return !isWaiting
}

// Helper functions to check if the game is in a drawing state
func isDrawingState(state RoomState) bool {
	_, isDrawing := state.(*DrawingState)
	return isDrawing
}
