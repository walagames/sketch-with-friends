package main

import (
	"fmt"
	"log/slog"
)

type CanvasElement struct {
	Id      string      `json:"id"`
	Type    ElementType `json:"type"`
	Payload interface{} `json:"payload"`
}

type ElementType string

type StrokeElement struct {
	Type   ElementType `json:"type"`
	Points [][]float64 `json:"points"`
	Color  string      `json:"color"`
	Width  int         `json:"width"`
	IsPartial bool     `json:"isPartial,omitempty"`
}

type FillElement struct {
	Type   ElementType `json:"type"`
	Point  []float64   `json:"point"`
	Color  string      `json:"color"` // hex color
}

type StrokeUpdate struct {
	Id     string      `json:"id"`
	Points [][]float64 `json:"points"`
	IsPartial bool     `json:"isPartial"`
}

// Decodes the raw payload into a CanvasElement.
// Throws an error if the payload is not a valid CanvasElement.
func decodeCanvasElement(payload interface{}) (CanvasElement, error) {
	if m, ok := payload.(map[string]interface{}); ok {
		// Log the payload size for debugging
		payloadSize := len(fmt.Sprintf("%v", m))
		slog.Debug("received element payload", "size", payloadSize)

		// Check for oversized points array
		if points, exists := m["points"]; exists {
			if p, ok := points.([]interface{}); ok {
				pointCount := len(p)
				// Increase the point limit since we're now batching
				if pointCount > 100000 { 
					slog.Warn("points array too large", "count", pointCount)
					return CanvasElement{}, fmt.Errorf("points array too large: %d points", pointCount)
				}
				slog.Debug("processing points array", "count", pointCount)
			}
		}

		// Add total payload size limit
		if payloadSize > 1024*1024 { // 1MB limit
			return CanvasElement{}, fmt.Errorf("payload too large: %d bytes", payloadSize)
		}
	}

	element, err := decodePayload[CanvasElement](payload)
	if err != nil {
		slog.Warn("failed to decode element", "error", err)
		return CanvasElement{}, err
	}
	return element, nil
}

// Updates the element to the new element based on the id.
func updateElement(elements []CanvasElement, element CanvasElement) []CanvasElement {
	for i, e := range elements {
		if e.Id == element.Id {
			elements[i] = element
			return elements
		}
	}
	return elements
}

// Returns a new empty slice of elements.
func emptyElementSlice() []CanvasElement {
	return make([]CanvasElement, 0)
}

// Returns a new slice of elements with the most recent element removed.
func undoElement(elements []CanvasElement) []CanvasElement {
	if len(elements) > 0 {
		return elements[:len(elements)-1]
	}
	return elements
}

// Updates the element's points based on the stroke update
func updateStrokePoints(elements []CanvasElement, update StrokeUpdate) []CanvasElement {
	slog.Debug("updateStrokePoints", "update", update)
    for i, e := range elements {
        if e.Id == update.Id {
            if stroke, ok := e.Payload.(map[string]interface{}); ok {
                currentPoints, _ := stroke["points"].([][]float64)
                if update.IsPartial {
                    stroke["points"] = append(currentPoints, update.Points...)
                } else {
                    stroke["points"] = update.Points
                }
                elements[i].Payload = stroke
            }
            break
        }
    }
    return elements
}