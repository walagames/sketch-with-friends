package http

import (
	"fmt"
	"net/http"

	realtime "github.com/jacobschwantes/sketch-with-friends/realtime/internal"
	"github.com/jacobschwantes/sketch-with-friends/realtime/internal/websocket"
)

func connect(rm realtime.RoomManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// grab room code
		var room realtime.Room
		var err error

		code := r.URL.Query().Get("room")
		if code == "" {
			// create room since no code was provided
			room, code, err = rm.CreateRoom()
			if err != nil {
				fmt.Println("failed to create room: ", err)
				http.Error(w, "Failed to create room", http.StatusInternalServerError)
				return
			}
			go room.Run(rm)
		} else {
			room, err = rm.Room(code)
			if err != nil {
				fmt.Println("failed to lookup room: ", err)
				http.Error(w, "Room lookup failed", http.StatusInternalServerError)
				return
			}
		}

		// upgrade client connection to websocket
		conn, err := websocket.UpgradeConnection(w, r)
		if err != nil {
			http.Error(w, "Failed to upgrade to websocket connection", http.StatusInternalServerError)
			return
		}

		// connect client to room
		err = room.Connect(conn)
		if err != nil {
			conn.Close()
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}
