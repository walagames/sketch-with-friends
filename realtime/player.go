package main

import (
	"fmt"
	"math/rand"
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

type AvatarConfig struct {
	HairStyle       string `json:"hairStyle"`
	HairColor       string `json:"hairColor"`
	Mood            string `json:"mood"`
	SkinColor       string `json:"skinColor"`
	BackgroundColor string `json:"backgroundColor"`
}

type playerProfile struct {
	Username     string        `json:"username"`
	AvatarConfig *AvatarConfig `json:"avatarConfig"`
}

// player represents an individual participant in the game.
//
// Players are created when a user joins a room and are maintained throughout
// the game session. The player struct is central to many game operations,
// including scoring, role assignment, and message routing.
type player struct {
	ID                uuid.UUID     `json:"id"`
	Profile           playerProfile `json:"profile"`
	RoomRole          RoomRole      `json:"roomRole"`
	GameRole          GameRole      `json:"gameRole"`
	Score             int           `json:"score"`
	Streak            int           `json:"streak"`
	lastInteractionAt time.Time
	client            *client
}

func NewPlayer(role RoomRole) *player {
	return &player{
		ID: uuid.New(),
		Profile: playerProfile{
			Username:     "",
			AvatarConfig: &AvatarConfig{},
		},
		RoomRole:          role,
		Score:             0,
		GameRole:          GameRoleGuessing,
		lastInteractionAt: time.Now(),
		Streak:            0,
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

// Generates a random username for a player.
func randomUsername() string {
	adjectives := []string{
		"Bad", "Lazy", "Odd", "Wild", "Sad",
		"Mad", "Shy", "Fast", "Slow", "Neat",
	}

	nouns := []string{
		"Paint", "Art", "Pen", "Brush", "Ink",
		"Sketch", "Draw", "Line", "Dot", "Doodle",
	}

	adj := adjectives[rand.Intn(len(adjectives))]
	noun := nouns[rand.Intn(len(nouns))]
	num := rand.Intn(99)

	return fmt.Sprintf("%s%s%d", adj, noun, num)
}
