package main

import (
	"time"

	"github.com/google/uuid"
)

// PostDrawingState represents the state after a drawing round has completed
type PostDrawingState struct {
	pointsAwarded map[uuid.UUID]int // Maps player IDs to points they earned this round
	endsAt        time.Time         // When this state should automatically transition
}

// NewPostDrawingState creates a new post-drawing state with the given points distribution
func NewPostDrawingState(pointsAwarded map[uuid.UUID]int) RoomState {
	return &PostDrawingState{
		pointsAwarded: pointsAwarded,
		endsAt:        time.Now().Add(time.Second * 5), // Show results for 5 seconds
	}
}

// Enter is called when transitioning into the post-drawing state
func (state *PostDrawingState) Enter(room *room) {
	// Schedule automatic transition after 5 seconds
	room.scheduler.addEvent(ScheduledStateChange, state.endsAt, func() {
		room.Transition()
	})

	// Broadcast the results to all players
	room.broadcast(GameRoleAny,
		event(SetPointsAwardedEvt, state.pointsAwarded),
		event(SetCurrentStateEvt, PostDrawing),
		event(SetTimerEvt, state.endsAt.UTC()),
	)
}

// Exit is called when leaving the post-drawing state
func (state *PostDrawingState) Exit(room *room) {
	// Clear the drawing canvas and update player list
	room.broadcast(GameRoleAny,
		event(ClearStrokesEvt, nil),
		event(SetPlayersEvt, room.Players),
	)

	// Transition to picking state with new random words
	room.setState(
		NewPickingState(
			randomWordOptions(
				3, // Number of words to choose from
				room.Settings.WordDifficulty,
				room.Settings.CustomWords,
			),
		),
	)
}

// HandleCommand processes incoming commands during the post-drawing state
func (state *PostDrawingState) HandleCommand(room *room, cmd *Command) error {
	switch cmd.Type {
	case PlayerJoinedCmd:
		state.handlePlayerJoined(cmd)
	}
	return nil
}

// handlePlayerJoined handles when a new player joins during the post-drawing state
func (state *PostDrawingState) handlePlayerJoined(cmd *Command) {
	// Send the current game state to the new player
	cmd.Player.Send(
		event(SetCurrentStateEvt, PostDrawing),
		event(SetTimerEvt, state.endsAt.UTC()),
	)
}
