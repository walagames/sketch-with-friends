package main

import (
	"context"
	"log/slog"

	// "os"

	"github.com/gorilla/websocket"
	// "golang.org/x/time/rate"

	"time"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

type client struct {
	room   *room
	player *player
	conn   *websocket.Conn
	send   chan []*Action
	cancel context.CancelFunc
}

func NewClient(conn *websocket.Conn, room *room, player *player) *client {
	return &client{
		room:   room,
		player: player,
		conn:   conn,
		send:   make(chan []*Action, 256),
	}
}

func (c *client) run(roomCtx context.Context) {
	ctx, cancel := context.WithCancel(roomCtx)
	c.cancel = cancel

	ready := make(chan bool, 2)

	go c.read(ctx, ready)
	go c.write(ctx, ready)

	// block return until both go routines start
	<-ready
	<-ready
	slog.Info("client is ready", "player_id", c.player.ID)
}

func (c *client) close() {
	c.cancel()
	c.room.disconnect <- c.player
	slog.Info("client disconnected", "player", c.player.ID)
}

// readPump pumps messages from the websocket connection to the room.
//
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine
func (c *client) read(ctx context.Context, ready chan<- bool) {
	slog.Debug("Read routine started", "player", c.player.ID)
	ready <- true
	defer func() {
		c.conn.Close()
		c.close()
		slog.Debug("Read routine exited: ", "player", c.player.ID)
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	// limiter := rate.NewLimiter(0.5, 5)

	for {
		select {
		case <-ctx.Done():
			return
		default:
			_, msgBytes, err := c.conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					slog.Warn("unexpected close error", "player", c.player.ID, "error", err)
					return
				}
				return
			}
			// if limiter.Allow() {
			if true {
				action, err := decode(msgBytes)
				if err != nil {
					slog.Error("Error un-marshalling message", "player", c.player.ID, "error", err)
					return
				}

				action.Player = c.player
				c.room.action <- action
				slog.Debug("received action from client", "player", c.player.ID, "action", action.Type)
			} else {
				slog.Warn("dropped event", "player", c.player.ID)
			}

		}
	}
}

// writePump pumps messages from the room to the websocket connection.
//
// A goroutine running writePump is started for each connection. The
// application ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
func (c *client) write(ctx context.Context, ready chan<- bool) {
	slog.Debug("Write routine started", "player", c.player.ID)
	ready <- true
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
		slog.Info("Write routine exited", "player", c.player.ID)
	}()
	for {
		select {
		case <-ctx.Done():
			return
		case actions, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The room closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				slog.Error("error getting next writer", "player", c.player.ID, "error", err)
				return
			}

			w.Write(encode(actions))

			// TODO: reformat this to send multiple messages at once, switch to an array of events
			// Can reduce latency by sending multiple events / messages at once

			// Add queued messages to the current websocket message.
			// n := len(c.Send)
			// for i := 0; i < n; i++ {
			// 	w.Write(newline)
			// 	w.Write(<-c.Send)
			// }

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
