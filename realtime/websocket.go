package main

import (
	"log/slog"
	"net/http"


	"github.com/gorilla/websocket"
)


var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// allowedOrigin := os.Getenv("CORS_ORIGIN") // Adjust this to match your Next.js app's origin
		// return r.Header.Get("Origin") == allowedOrigin
		// ! This is a security risk, but it's fine for local development
		return true
	},
}

func UpgradeConnection(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	return upgrader.Upgrade(w, r, nil)
}

func CloseConnectionWithReason(conn *websocket.Conn, reason string) {
	closeMessage := websocket.FormatCloseMessage(websocket.CloseNormalClosure, reason)
	err := conn.WriteMessage(websocket.CloseMessage, closeMessage)
	if err != nil {
		slog.Error("Error closing connection", "error", err)
	}
	conn.Close()
}
