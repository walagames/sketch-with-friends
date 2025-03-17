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

func TestHandleChatMessageBounding(t *testing.T) {
	// setup room
	room := &room{
		ChatMessages: make([]ChatMessage, 0),
	}

	// add MAX_CHAT_MESSAGES + 10 messages
	for i := 0; i < MAX_CHAT_MESSAGES+10; i++ {
		msg := ChatMessage{
			ID:       uuid.New(),
			PlayerID: uuid.New(),
			Content:  "test message",
			Type:     ChatMessageTypeDefault,
		}
		room.handleChatMessage(msg)
	}

	// verify we only kept the last MAX_CHAT_MESSAGES
	if len(room.ChatMessages) != MAX_CHAT_MESSAGES {
		t.Errorf("expected %d messages, got %d", MAX_CHAT_MESSAGES, len(room.ChatMessages))
	}

	// verify messages are in correct order (newest last)
	for i := 1; i < len(room.ChatMessages); i++ {
		if room.ChatMessages[i].ID == room.ChatMessages[i-1].ID {
			t.Error("messages should be unique and in order")
		}
	}
}
