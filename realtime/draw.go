package main

import "log/slog"

type Stroke struct {
	Points [][]int `json:"points"`
	Color  string  `json:"color"` // hex color
	Width  int     `json:"width"`
}



func decodeStroke(payload interface{}) (Stroke, error) {
	stroke, err := decodePayload[Stroke](payload)
	if err != nil {
		slog.Warn("failed to decode stroke", "error", err)
		return Stroke{}, err
	}
	return stroke, nil
}

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

// Removes all strokes from the strokes slice by creating a new empty slice
func emptyStrokeSlice() []Stroke {
	return make([]Stroke, 0)
}

// Removes the most recent stroke from the strokes slice
func removeLastStroke(strokes []Stroke) []Stroke {
	if len(strokes) > 0 {
		return strokes[:len(strokes)-1]
	}
	return strokes
}
