package main

import (
	"context"
	"testing"

	"github.com/google/uuid"
)

func TestResetPlayerStates(t *testing.T) {
	room := &room{
		Players:      make(map[uuid.UUID]*player),
		CurrentRound: 5,
	}

	room.register(context.Background(), &player{
		ID:       uuid.New(),
		GameRole: GameRoleGuessing,
		Score:    5,
		Streak:   5,
	})

	room.resetGameState()

	for _, p := range room.Players {
		if p.GameRole != GameRoleGuessing {
			t.Errorf("Expected GameRole to be GameRoleGuessing, got %v", p.GameRole)
		}
		if p.Score != 0 {
			t.Errorf("Expected Score to be 0, got %d", p.Score)
		}
		if p.Streak != 0 {
			t.Errorf("Expected Streak to be 0, got %d", p.Streak)
		}
	}

	if room.CurrentRound != 0 {
		t.Errorf("Expected CurrentRound to be 0, got %d", room.CurrentRound)
	}
}
