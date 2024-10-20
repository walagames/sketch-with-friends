package main

import (
	"log/slog"
	"net/http"

	"github.com/gorilla/websocket"
)

// WebSocket upgrader config
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// !!! We need to set this up in production
		return true
	},
}

// Upgrades an HTTP connection to a WebSocket connection.
func UpgradeConnection(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	return upgrader.Upgrade(w, r, nil)
}

// Closes a WebSocket connection with a reason.
// This is useful for sending a message to the client before closing the connection.
// Ex. Telling the client the room is full on first connection attempt.
func CloseConnectionWithReason(conn *websocket.Conn, reason string) {
	closeMessage := websocket.FormatCloseMessage(websocket.CloseNormalClosure, reason)
	err := conn.WriteMessage(websocket.CloseMessage, closeMessage)
	if err != nil {
		slog.Error("Error closing connection", "error", err)
	}
	conn.Close()
}
