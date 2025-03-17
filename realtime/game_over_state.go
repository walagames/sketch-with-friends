package main

import "log/slog"

// The game over state is the final state of the game.
// It is entered when the game is over and the players have no more rounds to play.
// It is used to display the final scoreboard and announce the winner.
// ! This state is not in use yet.
type GameOverState struct {
}

func NewGameOverState() RoomState {
	return &GameOverState{}
}

func (state GameOverState) Enter(room *room) {
	slog.Debug("Game over enter")
	room.broadcast(GameRoleAny, event(SetCurrentStateEvt, GameOver))
}

func (state GameOverState) Exit(room *room) {
	slog.Debug("Game over exit")
}

func (state GameOverState) handlePlayerJoined(room *room, cmd *Command) error {
	cmd.Player.Send(
		event(SetCurrentStateEvt, GameOver),
	)
	return nil
}

func (state GameOverState) HandleCommand(room *room, cmd *Command) error {
	switch cmd.Type {
	case PlayerJoinedCmd:
		return state.handlePlayerJoined(room, cmd)
	}
	return nil
}
