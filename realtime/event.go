package main

import (
	"encoding/json"
	"errors"
	"log/slog"
)

// Events are messages sent from the server to the client.
// They are used to trigger actions on the frontend and update the state of the game.
// They are also used to send messages to the players.

type EventType string

var (
	ErrInvalidEvent = errors.New("invalid or unexpected event")
)

const (
	// Generic message types to trigger alert messages on frontend
	Error   EventType = "error"
	Warning EventType = "warning"
	Info    EventType = "info"
)

const (
	AddStrokeEvt      EventType = "canvas/addStroke"
	AddStrokePointEvt EventType = "canvas/addStrokePoint"
	ClearStrokesEvt   EventType = "canvas/clearStrokes"
	UndoStrokeEvt     EventType = "canvas/undoStroke"
	SetStrokesEvt     EventType = "canvas/setStrokes"

	SetPointsAwardedEvt EventType = "game/setPointsAwarded"
	SetWordOptionsEvt   EventType = "game/setWordOptions"
	SetSelectedWordEvt  EventType = "game/selectWord"

	RoomInitEvt           EventType = "room/init"
	SetPlayerIdEvt        EventType = "room/setPlayerId"
	SetPlayersEvt         EventType = "room/setPlayers"
	PlayerJoinedEvt       EventType = "room/playerJoined"
	PlayerLeftEvt         EventType = "room/playerLeft"
	ChangeRoomSettingsEvt EventType = "room/changeRoomSettings"
	SetChatEvt            EventType = "room/setChat"
	NewChatMessageEvt     EventType = "room/newChatMessage"
	SetCurrentRoundEvt    EventType = "room/setCurrentRound"
	SetCurrentStateEvt    EventType = "room/setCurrentState"
	SetTimerEvt           EventType = "room/setTimer"
)

type Event struct {
	Type    EventType   `json:"type"`
	Payload interface{} `json:"payload"`
}

// Construct an event
func event(eventType EventType, payload interface{}) *Event {
	return &Event{
		Type:    eventType,
		Payload: payload,
	}
}

// Encode a slice of events into a JSON byte slice
func encodeEvents(events []*Event) ([]byte, error) {
	jsonBytes, err := json.Marshal(events)
	if err != nil {
		slog.Error("error marshalling events", "error", err)
		return nil, err
	}
	return jsonBytes, nil
}
