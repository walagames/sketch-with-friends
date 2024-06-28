package realtime

import "context"

type Game interface {
	Run(ctx context.Context, l Room)
	PushEvent(e *Event)
}

type GameState struct {
	CurrentRound     int               `json:"currentRound,omitempty"`
	SubmittedAnswers map[string]string `json:"-"`
}
type GameSettings struct {
	QuizID      string `json:"quizID"`
	TotalRounds int    `json:"totalRounds,omitempty"`
	TimeLimit   int    `json:"timeLimit,omitempty"` // in seconds
}

// Player emitted events

// Server emitted events
const (
	UPDATE_SCORES RoomEventType = "UPDATE_SCORES"
	NEW_ROUND     RoomEventType = "NEW_ROUND"
	GAME_START    RoomEventType = "GAME_START"
	GAME_OVER     RoomEventType = "GAME_OVER"
)

type Point struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type Stroke struct {
	UserID   string  `json:"userID"`
	Points   []Point `json:"points"`
	Color    string  `json:"color"` // hex color
	Finished bool    `json:"finished"`
}

type StrokeEvent struct {
	Point []int `json:"point"`
}

