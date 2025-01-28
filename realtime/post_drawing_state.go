package main

import (
	"time"

	"github.com/google/uuid"
)

type PostDrawingState struct {
	pointsAwarded map[uuid.UUID]int
	endsAt        time.Time
}

func NewPostDrawingState(pointsAwarded map[uuid.UUID]int) *PostDrawingState {
	return &PostDrawingState{
		pointsAwarded: pointsAwarded,
		endsAt:        time.Now().Add(time.Second * 5),
	}
}

func (state *PostDrawingState) Enter(room *room) {
	// phaseDuration := PostDrawingPhaseDuration

	room.scheduler.addEvent(ScheduledStateChange, state.endsAt, func() {
		room.Transition()
	})

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
		event(SetTimerEvt, state.endsAt.UTC()),
	)

}

func (state *PostDrawingState) Exit(room *room) {
	// Inform players of the state changes
	room.broadcast(GameRoleAny,
		event(ClearStrokesEvt, nil),
		event(SetPlayersEvt, room.Players),
	)

	room.setState(NewPickingState(randomWordOptions(3, room.Settings.WordDifficulty, room.Settings.CustomWords)))
}

func (state *PostDrawingState) HandleCommand(room *room, cmd *Command) error {
	switch cmd.Type {
	case PlayerJoinedCmd:
		return state.handlePlayerJoined(room, cmd)
	}
	return nil
}

func (state *PostDrawingState) handlePlayerJoined(room *room, cmd *Command) error {
	player := cmd.Player
	room.enqueueDrawingPlayer(player)
	player.Send(
		event(SetCurrentStateEvt, PostDrawing),
		event(SetTimerEvt, state.endsAt.UTC()),
	)
	return nil
}
