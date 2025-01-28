package main

import "log/slog"

type GameOverState struct {
}

func NewGameOverState() *GameOverState {
	return &GameOverState{}
}

func (state GameOverState) Enter(room *room) {
	slog.Info("Game over enter")
}

func (state GameOverState) Exit(room *room) {
	slog.Info("Game over exit")
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
