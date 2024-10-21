package main

import (
	"time"

	"github.com/google/uuid"
	"golang.org/x/time/rate"
)

type RoomRole string

const (
	RoomRoleHost   RoomRole = "host"
	RoomRolePlayer RoomRole = "player"
	RoomRoleAny    RoomRole = "any"
)

type GameRole string

const (
	GameRoleGuessing GameRole = "guessing"
	GameRoleDrawing  GameRole = "drawing"
	GameRoleAny      GameRole = "any"
)

// We use this to create a new player based on params passed
// in form route handlers.
type playerOptions struct {
	roomRole    RoomRole
	name        string
	avatarSeed  string
	avatarColor string
}

// player represents an individual participant in the game.
//
// Players are created when a user joins a room and are maintained throughout
// the game session. The player struct is central to many game operations,
// including scoring, role assignment, and message routing.
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

// Passes messages to the player's client.
func (p *player) Send(actions ...*Action) {
	actionList := append([]*Action{}, actions...)
	p.client.send <- actionList
}

// Updates the player's rate limiter based on their game role.
//
// We use this to prevent spamming and server abuse by applying
// different limits to drawing and guessing.
//
// Drawing players send many more messages to add strokes to drawings,
// so we need to account for that.
func (p *player) UpdateLimiter() {
	if p.GameRole == GameRoleDrawing {
		// 500 actions per second, 20 actions in a burst
		p.client.limiter = rate.NewLimiter(500, 20)
	} else {
		// 2 actions per second, 4 actions in a burst
		p.client.limiter = rate.NewLimiter(2, 4)
	}
}
