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
	ID     string                 `json:"id"`
	Name   string                 `json:"name"`
	Role   PlayerRole             `json:"role"`
	Status PlayerConnectionStatus `json:"status"`
}

type Player interface {
	Status() PlayerConnectionStatus
	ChangeStatus(status PlayerConnectionStatus)
	Role() PlayerRole
	ChangeRole(role PlayerRole)
	Info() *PlayerInfo
}


type player struct {
	id      uuid.UUID
	name    string
	role    PlayerRole
	status  PlayerConnectionStatus
	mu      sync.RWMutex
}

func NewPlayer(role PlayerRole, name string) Player {
	return &player{
		id:      uuid.New(),
		name:    name,
		role:    role,
		status:  StatusJoining,
	}
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
		ID:      p.id.String(),
		Name:    p.name,
		Role:    p.role,
		Status:  p.status,
	}
}
