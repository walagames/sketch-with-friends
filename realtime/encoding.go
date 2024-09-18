package main

import (
	"encoding/json"
	"log/slog"

	"github.com/mitchellh/mapstructure"
)

// Decode event payload into a target type
func decodePayload[T any](payload interface{}) (T, error) {
	var target T
	err := mapstructure.Decode(payload, &target)
	if err != nil {
		slog.Warn("failed to decode payload", "error", err)
		return target, err
	}
	return target, nil
}

// Marshal an event into JSON
func marshalEvent[T any](eventType RoomEventType, payload T) []byte {
	event := RoomEvent{
		Type:    eventType,
		Payload: payload,
	}

	jsonBytes, err := json.Marshal(event)
	if err != nil {
		slog.Error("error marshalling event", "error", err, "eventType", eventType)
		return nil
	}

	return jsonBytes
}

// Unmarshal an event from JSON
func unmarshalEvent(data []byte) (*RoomEvent, error) {
	var event RoomEvent
	err := json.Unmarshal(data, &event)
	if err != nil {
		slog.Error("error unmarshalling event", "error", err)
		return nil, err
	}
	return &event, nil
}
