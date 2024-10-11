package main

import (
	"log/slog"

	"github.com/google/uuid"
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
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	RoomRole    RoomRole  `json:"roomRole"`
	GameRole    GameRole  `json:"gameRole"`
	AvatarSeed  string    `json:"avatarSeed"`
	AvatarColor string    `json:"avatarColor"`
	Score       int       `json:"score"`
	client      *client
}

type playerOptions struct {
	roomRole    RoomRole
	name        string
	avatarSeed  string
	avatarColor string
}

func NewPlayer(opts *playerOptions) *player {
	return &player{
		ID:          uuid.New(),
		Name:        opts.name,
		AvatarSeed:  opts.avatarSeed,
		AvatarColor: opts.avatarColor,
		RoomRole:    opts.roomRole,
		Score:       0,
		GameRole:    GameRoleGuessing,
	}
}

func (p *player) Send(actions ...*Action) {
	actionList := []*Action{}
	for _, action := range actions {
		actionList = append(actionList, action)
	}
	p.client.send <- actionList
}

func (p *player) Kick() {
	slog.Info("kicking player", "player", p.ID)
	p.client.close()
}
