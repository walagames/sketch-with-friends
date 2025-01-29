package main

import (
	"errors"
	"log/slog"
	"time"
)

var (
	ErrEventAlreadyExists = errors.New("event already exists")
	ErrEventNotFound      = errors.New("event not found")
)

type ScheduledEventType string

const (
	ScheduledStateChange ScheduledEventType = "state_change"
)

type ScheduledEvent struct {
	nextRunAt   time.Time
	interval    time.Duration
	handler     func()
	isRecurring bool
	runCount    int
	runLimit    int
}

type GameScheduler struct {
	events map[ScheduledEventType]*ScheduledEvent
	now    time.Time
}

func NewGameScheduler() *GameScheduler {
	return &GameScheduler{
		events: make(map[ScheduledEventType]*ScheduledEvent),
		now:    time.Now(),
	}
}

func (s *GameScheduler) tick(delta time.Duration) {
	s.now = s.now.Add(delta)

	for id, event := range s.events {
		if s.now.After(event.nextRunAt) {
			slog.Debug("calling handler", "id", id)
			event.handler()

			if event.isRecurring {
				event.runCount++
				if event.runLimit > 0 && event.runCount >= event.runLimit {
					slog.Debug("event reached run limit, deleting", "id", id)
					delete(s.events, id)
				} else {
					slog.Debug("event is recurring, adding interval", "id", id, "interval", event.interval)
					event.nextRunAt = event.nextRunAt.Add(event.interval)
				}
			} else {
				slog.Debug("event is not recurring, deleting", "id", id)
				// delete(s.events, id)
			}
		}
	}
}

func (s *GameScheduler) addEvent(eventType ScheduledEventType, when time.Time, handler func()) (evt *ScheduledEvent, err error) {
	event := &ScheduledEvent{
		nextRunAt: when,
		handler:   handler,
	}

	// if s.events[eventType] != nil {
	// 	return nil, ErrEventAlreadyExists
	// }

	s.events[eventType] = event
	slog.Debug("event added", "eventType", eventType, "when", when)
	return event, nil
}

func (s *GameScheduler) addReccuringEvent(eventType ScheduledEventType, interval time.Duration, runLimit int, handler func()) (evt *ScheduledEvent, err error) {
	event := &ScheduledEvent{
		nextRunAt:   time.Now().Add(interval),
		interval:    interval,
		handler:     handler,
		isRecurring: true,
		runCount:    0,
		runLimit:    runLimit,
	}

	if s.events[eventType] != nil {
		slog.Debug("event already exists", "eventType", eventType)
		return nil, ErrEventAlreadyExists
	}

	s.events[eventType] = event
	return event, nil
}

func (s *GameScheduler) cancelEvent(eventType ScheduledEventType) error {
	if s.events[eventType] == nil {
		slog.Debug("event not found", "eventType", eventType)
		return ErrEventNotFound
	}

	slog.Debug("cancelling event", "eventType", eventType)

	delete(s.events, eventType)
	return nil
}

func (s *GameScheduler) clearEvents() {
	s.events = make(map[ScheduledEventType]*ScheduledEvent)
}
