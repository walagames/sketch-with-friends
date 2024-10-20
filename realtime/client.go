package main

import (
	"context"
	"log/slog"

	"github.com/gorilla/websocket"
	"golang.org/x/time/rate"

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
	room    *room
	player  *player
	conn    *websocket.Conn
	limiter *rate.Limiter
	send    chan []*Action
	cancel  context.CancelCauseFunc
}

func NewClient(conn *websocket.Conn, room *room, player *player) *client {
	return &client{
		room:    room,
		player:  player,
		conn:    conn,
		limiter: rate.NewLimiter(0.5, 5),
		send:    make(chan []*Action, 256),
	}
}

func (c *client) run(roomCtx context.Context) {
	ctx, cancel := context.WithCancelCause(roomCtx)
	c.cancel = cancel

	ready := make(chan bool, 2)

	go c.read(ctx, ready)
	go c.write(ctx, ready)

	// block return until both go routines start
	<-ready
	<-ready
	slog.Info("client is ready", "player_id", c.player.ID)
}

func (c *client) close(cause error) {
	c.cancel(cause)
}

// read decodes and sends messages from the player's websocket connection to the room.
//
// The application runs read in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine
func (c *client) read(ctx context.Context, ready chan<- bool) {
	slog.Debug("read routine started", "player", c.player.ID)
	ready <- true
	defer func() {
		c.conn.Close()
		slog.Debug("read routine exited", "player", c.player.ID)
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		select {
		case <-ctx.Done():
			slog.Debug("read routine cancelled", "player", c.player.ID, "cause", context.Cause(ctx))
			c.room.disconnect <- c.player
			return
		default:
			_, msgBytes, err := c.conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					slog.Error("unexpected close error", "player", c.player.ID, "error", err)
				}
				c.cancel(err)
				break
			}
			if c.limiter.Allow() {
				action, err := decode(msgBytes)
				if err != nil {
					slog.Error("Error un-marshalling message", "player", c.player.ID, "error", err)
					c.cancel(err)
					break
				}

				action.Player = c.player
				c.room.action <- action
				slog.Debug("received action from client", "player", c.player.ID, "action", action.Type)
			} else {
				slog.Debug("dropped event", "player", c.player.ID)
				c.send <- []*Action{
					{
						Type:    Warning,
						Payload: "Slow down! You're sending messages too quickly!",
					},
				}
			}

		}
	}
}

// write encodes and sends messages to the player's websocket connection.
//
// A goroutine running write is started for each player connection.
// This ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
// Read more: https://pkg.go.dev/github.com/gorilla/websocket?utm_source=godoc#hdr-Concurrency
func (c *client) write(ctx context.Context, ready chan<- bool) {
	slog.Debug("write routine started", "player", c.player.ID)
	ready <- true
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
		slog.Debug("write routine exited", "player", c.player.ID)
	}()
	for {
		select {
		case <-ctx.Done():
			slog.Debug("write routine cancelled", "player", c.player.ID, "cause", context.Cause(ctx))
			closeMsg := websocket.FormatCloseMessage(websocket.CloseNormalClosure, context.Cause(ctx).Error())
			err := c.conn.WriteControl(websocket.CloseMessage, closeMsg, time.Now().Add(writeWait))
			if err != nil && websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				slog.Error("error sending close message", "player", c.player.ID, "error", err)
			}
			return
		case actions, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				slog.Debug("write routine channel closed", "player", c.player.ID)
				c.cancel(nil)
				break
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				slog.Error("error getting next writer", "player", c.player.ID, "error", err)
				c.cancel(err)
				break
			}

			w.Write(encode(actions))

			if err := w.Close(); err != nil {
				c.cancel(err)
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				c.cancel(err)
			}
		}
	}
}
