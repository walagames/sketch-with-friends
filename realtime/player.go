package main

import (
	"time"

	"github.com/google/uuid"
	"golang.org/x/time/rate"
)

type RoomRole string
type GameRole string

const (
	RoomRoleHost   RoomRole = "host"
	RoomRolePlayer RoomRole = "player"
	RoomRoleAny    RoomRole = "any"
)

const (
	GameRoleGuessing GameRole = "guessing"
	GameRoleDrawing  GameRole = "drawing"
	GameRoleAny      GameRole = "any"
)

type player struct {
	ID                uuid.UUID `json:"id"`
	Name              string    `json:"name"`
	RoomRole          RoomRole  `json:"roomRole"`
	GameRole          GameRole  `json:"gameRole"`
	AvatarSeed        string    `json:"avatarSeed"`
	AvatarColor       string    `json:"avatarColor"`
	Score             int       `json:"score"`
	lastInteractionAt time.Time
	client            *client
	limiter           *rate.Limiter
}

type playerOptions struct {
	roomRole    RoomRole
	name        string
	avatarSeed  string
	avatarColor string
}

func NewPlayer(opts *playerOptions) *player {
	return &player{
		ID:                uuid.New(),
		Name:              opts.name,
		AvatarSeed:        opts.avatarSeed,
		AvatarColor:       opts.avatarColor,
		RoomRole:          opts.roomRole,
		Score:             0,
		GameRole:          GameRoleGuessing,
		lastInteractionAt: time.Now(),
	}
}

func (p *player) Send(actions ...*Action) {
	actionList := append([]*Action{}, actions...)
	p.client.send <- actionList
}

func (p *player) UpdateLimiter() {
	if p.GameRole == GameRoleDrawing {
		// Needs to be high to allow for fast drawing
		// 500 actions per second, 20 actions in a burst
		p.client.limiter = rate.NewLimiter(500, 20)
	} else {
		// This is mostly to prevent players from spamming guesses
		// 2 actions per second, 4 actions in a burst
		p.client.limiter = rate.NewLimiter(2, 4)
	}
}
