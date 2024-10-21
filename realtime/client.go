package main

import (
	"context"
	"log/slog"

	"github.com/gorilla/websocket"
	"golang.org/x/time/rate"

	"time"
)

const (
	// Time allowed to write a message to the client.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the client.
	pongWait = 60 * time.Second

	// Send pings to client with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from client.
	maxMessageSize = 512
)

// client represents a connection between the server and a client.
//
// Each client is associated with a specific room and player, and maintains
// a websocket connection for communication. The client struct handles reading
// and writing messages to the client, as well as rate limiting and context
// management for the connection.
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
		limiter: rate.NewLimiter(2, 4),
		send:    make(chan []*Action, 256),
	}
}

// Launches the client's read and write routines.
// It blocks until both routines are fully started.
func (c *client) run(roomCtx context.Context) {
	ctx, cancel := context.WithCancelCause(roomCtx)
	c.cancel = cancel

	// Goroutines use this channel to tell us when they're ready
	ready := make(chan bool, 2)

	// Launch the routines
	go c.read(ctx, ready)
	go c.write(ctx, ready)

	// Block until both routines are ready
	<-ready
	<-ready
	slog.Debug("client is ready", "playerId", c.player.ID)
}

// Closes the client connection with the given cause.
// This lets us send a close message to the client with a specific error.
func (c *client) close(cause error) {
	c.cancel(cause)
}

// Reads messages from the client's websocket connection.
//
// The application runs read in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine
// Read more: https://pkg.go.dev/github.com/gorilla/websocket?utm_source=godoc#hdr-Concurrency
func (c *client) read(ctx context.Context, ready chan<- bool) {
	slog.Debug("read routine started", "playerId", c.player.ID)

	// Tell the caller we're ready
	ready <- true

	// This runs when the routine exits
	defer func() {
		c.conn.Close()
		slog.Debug("read routine exited", "playerId", c.player.ID)
	}()

	// Configure the websocket connection settings
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		select {
		case <-ctx.Done():
			c.room.disconnect <- c.player
			slog.Debug("read routine cancelled", "playerId", c.player.ID, "cause", context.Cause(ctx))
			return
		default:
			_, msgBytes, err := c.conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					slog.Warn("unexpected close error", "playerId", c.player.ID, "error", err)
				}
				c.cancel(err)
				break
			}

			// Make sure the client has not exceeded their rate limit
			if c.limiter.Allow() {
				// Parse the message into a usable data structure
				action, err := decodeAction(msgBytes)
				if err != nil {
					slog.Warn("Error un-marshalling message", "playerId", c.player.ID, "error", err)
					c.cancel(err)
					break
				}

				// Add the player to the action so the room knows who sent it
				action.Player = c.player

				// Send the action to the room to be processed
				c.room.action <- action
			} else {
				// The client has exceeded their rate limit, so send them a warning
				// and do nothing with the message.
				c.send <- []*Action{
					{
						Type:    Warning,
						Payload: "Slow down! You're sending messages too quickly!",
					},
				}
				slog.Debug("dropped event", "playerId", c.player.ID)
			}

		}
	}
}

// Writes messages to the client's websocket connection.
//
// A goroutine running write is started for each client connection.
// This ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
// Read more: https://pkg.go.dev/github.com/gorilla/websocket?utm_source=godoc#hdr-Concurrency
func (c *client) write(ctx context.Context, ready chan<- bool) {
	slog.Debug("write routine started", "playerId", c.player.ID)

	// Tell the caller we're ready
	ready <- true

	// Send a ping message to the client every so often
	ticker := time.NewTicker(pingPeriod)
	defer ticker.Stop()

	// This runs when the routine exits
	defer func() {
		c.conn.Close()
		slog.Debug("write routine exited", "playerId", c.player.ID)
	}()
	for {
		select {
		case <-ctx.Done():
			// Send a close message to the client with the cancellation cause so they
			// know why they were disconnected.
			closeMsg := websocket.FormatCloseMessage(websocket.CloseNormalClosure, context.Cause(ctx).Error())
			err := c.conn.WriteControl(websocket.CloseMessage, closeMsg, time.Now().Add(writeWait))

			// If the connection is already closed, we cant send a close message, so just log
			if err != nil && websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				slog.Warn("error sending close message", "playerId", c.player.ID, "error", err)
			}

			slog.Debug("write routine cancelled", "player", c.player.ID, "cause", context.Cause(ctx))
			return
		case actions, ok := <-c.send:
			// Set the write deadline
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))

			// If the channel is closed, cancel the client connection
			if !ok {
				slog.Debug("write routine channel closed", "playerId", c.player.ID)
				c.cancel(nil)
				break
			}

			// Get the next writer for the connection
			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				slog.Warn("error getting next writer", "playerId", c.player.ID, "error", err)
				c.cancel(err)
				break
			}

			// Encode the actions and send them to the client
			w.Write(encodeActions(actions))

			// If the writer fails to close, cancel the client connection
			if err := w.Close(); err != nil {
				c.cancel(err)
			}
		case <-ticker.C:
			// Send a ping message to the client to keep the connection alive
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				c.cancel(err)
			}
		}
	}
}
