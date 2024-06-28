package room

import (
	"sync"

	realtime "github.com/jacobschwantes/sketch-with-friends/realtime/internal"
)

type player struct {
	profile realtime.PlayerProfile
	role    realtime.PlayerRole
	status  realtime.PlayerStatus
	mu      sync.RWMutex
}

func NewPlayer(profile realtime.PlayerProfile, role realtime.PlayerRole) realtime.Player {
	return &player{
		profile: profile,
		role:    role,
		status:  realtime.StatusJoining,
	}
}

func (p *player) Status() realtime.PlayerStatus {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.status
}

func (p *player) ChangeStatus(newStatus realtime.PlayerStatus) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.status = newStatus
}

func (p *player) Role() realtime.PlayerRole {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.role
}

func (p *player) ChangeRole(r realtime.PlayerRole) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.role = r
}

func (p *player) ID() string {
	return p.profile.ID // wont change
}

func (p *player) Info() *realtime.PlayerInfo {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return &realtime.PlayerInfo{
		Profile: p.profile,
		Role:    p.role,
		Status:  p.status,
	}
}
