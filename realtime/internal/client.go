package realtime

import "context"

type Client interface {
	Send(msg []byte) error
	Run(ctx context.Context)
	Close()
}
