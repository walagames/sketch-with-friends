package main

import (
	"sync"

	"github.com/google/uuid"
)

type PlayerRole string

const (
	RoleHost   PlayerRole = "HOST"
	RolePlayer PlayerRole = "PLAYER"
)

type PlayerConnectionStatus string

const (
	StatusJoining   PlayerConnectionStatus = "JOINING"
	StatusConnected PlayerConnectionStatus = "CONNECTED"
)

type PlayerInfo struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Role        PlayerRole             `json:"role"`
	GameRole    GameRole               `json:"gameRole"`
	Status      PlayerConnectionStatus `json:"status"`
	AvatarSeed  string                 `json:"avatarSeed"`
	AvatarColor string                 `json:"avatarColor"`
	Score       int                    `json:"score"`
}

type Player interface {
	Status() PlayerConnectionStatus
	ChangeStatus(status PlayerConnectionStatus)
	Role() PlayerRole
	ChangeRole(role PlayerRole)
	GameRole() GameRole
	ChangeGameRole(role GameRole)
	SetClient(client *client)
	Client() *client
	Info() *PlayerInfo
	Score() int
	ChangeScore(score int)
}

type player struct {
	id          uuid.UUID
	name        string
	avatarSeed  string
	avatarColor string
	role        PlayerRole
	status      PlayerConnectionStatus
	score       int
	mu          sync.RWMutex
	gameRole    GameRole
	client      *client
}

func NewPlayer(role PlayerRole, name string, avatarSeed string, avatarColor string) Player {
	return &player{
		id:          uuid.New(),
		name:        name,
		avatarSeed:  avatarSeed,
		avatarColor: avatarColor,
		role:        role,
		status:      StatusJoining,
		score:       0,
		gameRole:    Guessing,
	}
}

func (p *player) SetClient(client *client) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.client = client
}

func (p *player) Client() *client {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.client
}

func (p *player) Status() PlayerConnectionStatus {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.status
}

func (p *player) ChangeStatus(newStatus PlayerConnectionStatus) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.status = newStatus
}

func (p *player) GameRole() GameRole {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.gameRole
}

func (p *player) ChangeGameRole(role GameRole) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.gameRole = role
}

func (p *player) Role() PlayerRole {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.role
}

func (p *player) ChangeRole(r PlayerRole) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.role = r
}

func (p *player) Info() *PlayerInfo {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return &PlayerInfo{
		ID:          p.id.String(),
		Name:        p.name,
		Role:        p.role,
		Status:      p.status,
		AvatarSeed:  p.avatarSeed,
		AvatarColor: p.avatarColor,
		GameRole:    p.gameRole,
	}
}

func (p *player) Score() int {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.score
}

func (p *player) ChangeScore(score int) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.score = score
}
