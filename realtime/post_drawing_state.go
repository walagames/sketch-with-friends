package main

import (
	"github.com/google/uuid"
)

type PostDrawingState struct {
	pointsAwarded map[uuid.UUID]int
}

func NewPostDrawingState(pointsAwarded map[uuid.UUID]int) RoomState {
	return PostDrawingState{
		pointsAwarded: pointsAwarded,
	}
}

func (state PostDrawingState) Enter(room *room) {
	// phaseDuration := PostDrawingPhaseDuration

	// If its the last phase, we increase the duration to allow
	// players to see the correct word and scoreboard for longer.
	isLastPhase := room.CurrentRound >= room.Settings.TotalRounds && len(room.drawingQueue) == 0
	if isLastPhase {
		// phaseDuration = time.Second * 15
	}

	// Inform players of the phase change and points awarded
	room.broadcast(GameRoleAny,
		event(SetPointsAwardedEvt, state.pointsAwarded),
		event(SetCurrentStateEvt, PostDrawing),
	)

}

func (state PostDrawingState) Exit(room *room) {
	// Inform players of the state changes
	room.broadcast(GameRoleAny,
		event(ClearStrokesEvt, nil),
		event(SetPlayersEvt, room.Players),
	)
}

func (state PostDrawingState) HandleCommand(room *room, cmd *Command) error {
	switch cmd.Type {
	case PlayerJoinedCmd:
		return state.handlePlayerJoined(room, cmd)
	}
	return nil
}

func (state PostDrawingState) handlePlayerJoined(room *room, cmd *Command) error {
	player := cmd.Player
	room.enqueueDrawingPlayer(player)
	player.Send(
		event(SetCurrentStateEvt, PostDrawing),
	)
	return nil
}
