package realtime

type PlayerRole string

const (
	RoleHost   PlayerRole = "HOST"
	RolePlayer PlayerRole = "PLAYER"
)

type PlayerStatus string

const (
	StatusJoining      PlayerStatus = "JOINING"
	StatusConnected    PlayerStatus = "CONNECTED"
	StatusDisconnected PlayerStatus = "DISCONNECTED"
)

type PlayerProfile struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type PlayerInfo struct {
	Role    PlayerRole    `json:"role"`
	Profile PlayerProfile `json:"profile"`
	Status  PlayerStatus `json:"status"`
}

type Player interface {
	ChangeStatus(status PlayerStatus)
	Role() PlayerRole
	ChangeRole(r PlayerRole)
	ID() string
	Info() *PlayerInfo
}
