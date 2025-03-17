package main

import (
	"time"

	"github.com/google/uuid"
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

type AvatarConfig struct {
	HairStyle       string `json:"hairStyle"`
	HairColor       string `json:"hairColor"`
	Mood            string `json:"mood"`
	SkinColor       string `json:"skinColor"`
	BackgroundColor string `json:"backgroundColor"`
}

var DefaultAvatarConfig = &AvatarConfig{
	HairStyle:       "bangs",
	HairColor:       "ff543d",
	Mood:            "hopeful",
	SkinColor:       "ffd6c0",
	BackgroundColor: "e0da29",
}

// player represents an individual participant in the game.
//
// Players are created when a user joins a room and are maintained throughout
// the game session. The player struct is central to many game operations,
// including scoring, role assignment, and message routing.
type player struct {
	ID                uuid.UUID     `json:"id"`
	Username          string        `json:"username"`
	AvatarConfig      *AvatarConfig `json:"avatarConfig"`
	RoomRole          RoomRole      `json:"roomRole"`
	GameRole          GameRole      `json:"gameRole"`
	Score             int           `json:"score"`
	Streak            int           `json:"streak"`
	lastInteractionAt time.Time
	client            *client
}

func NewPlayer(role RoomRole) *player {
	return &player{
		ID:                uuid.New(),
		Username:          "",
		AvatarConfig:      DefaultAvatarConfig,
		RoomRole:          role,
		Score:             0,
		GameRole:          GameRoleGuessing,
		lastInteractionAt: time.Now(),
		Streak:            0,
	}
}

// Passes messages to the player's client.
func (p *player) Send(events ...*Event) {
	eventList := append([]*Event{}, events...)
	p.client.send <- eventList
}
