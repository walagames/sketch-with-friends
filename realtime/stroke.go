package main

import "log/slog"

type Stroke struct {
	Points [][]int `json:"points"`
	Color  string  `json:"color"` // hex color
	Width  int     `json:"width"`
	Type   string  `json:"type,omitempty"` // "brush" or "fill"
}

// Decodes the raw payload into a Stroke.
// Throws an error if the payload is not a valid Stroke.
func decodeStroke(payload interface{}) (Stroke, error) {
	stroke, err := decodePayload[Stroke](payload)
	if err != nil {
		slog.Warn("failed to decode stroke", "error", err)
		return Stroke{}, err
	}
	return stroke, nil
}

// Decodes the raw payload into a slice of integers.
// Throws an error if the payload is not a valid slice of integers.
func decodeStrokePoint(payload interface{}) ([]int, error) {
	point, err := decodePayload[[]int](payload)
	if err != nil {
		slog.Warn("failed to decode stroke point", "error", err)
		return []int{}, err
	}
	return point, nil
}

// Decodes a stroke point payload and appends it to the most recent stroke
func appendStrokePoint(strokes []Stroke, point []int) []Stroke {
	if len(strokes) == 0 {
		return strokes
	}
	strokes[len(strokes)-1].Points = append(strokes[len(strokes)-1].Points, point)
	return strokes
}

// Returns a new empty slice of strokes.
func emptyStrokeSlice() []Stroke {
	return make([]Stroke, 0)
}

// Returns a new slice of strokes with the most recent stroke removed.
func removeLastStroke(strokes []Stroke) []Stroke {
	if len(strokes) > 0 {
		return strokes[:len(strokes)-1]
	}
	return strokes
}
