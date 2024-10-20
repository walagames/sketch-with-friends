package main

import (
	"errors"
	"log/slog"
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

var (
	ErrPlayerKicked = errors.New("ErrPlayerKicked")
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

func (p *player) Kick() {
	slog.Info("kicking player", "player", p.ID)
	p.client.close(ErrPlayerKicked)
}

func (p *player) UpdateLimiter() {
	if p.GameRole == GameRoleDrawing {
		// 500 actions per second
		// Needs to be high to allow for fast drawing
		// Ideally we should batch stroke points at the client to lower the rate needed here
		p.client.limiter = rate.NewLimiter(500, 1)
	} else {
		// 2 actions per second, 4 actions in a burst
		// This is to prevent players from guessing too quickly
		p.client.limiter = rate.NewLimiter(2, 4)
	}
}
