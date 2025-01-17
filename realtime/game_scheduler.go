package main

import (
	"errors"
	"time"
)

var (
	ErrEventAlreadyExists = errors.New("event already exists")
	ErrEventNotFound      = errors.New("event not found")
)

type ScheduledEventType string

const (
	ScheduledStateChange ScheduledEventType = "state_change"
	ScheduledHintReveal  ScheduledEventType = "hint_reveal"
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
			event.handler()

			if event.isRecurring {
				event.runCount++
				if event.runLimit > 0 && event.runCount >= event.runLimit {
					delete(s.events, id)
				} else {
					event.nextRunAt = event.nextRunAt.Add(event.interval)
				}
			} else {
				delete(s.events, id)
			}
		}
	}
}

func (s *GameScheduler) addEvent(eventType ScheduledEventType, when time.Time, handler func()) (evt *ScheduledEvent, err error) {
	event := &ScheduledEvent{
		nextRunAt: when,
		handler:   handler,
	}

	if s.events[eventType] != nil {
		return nil, ErrEventAlreadyExists
	}

	s.events[eventType] = event
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
		return nil, ErrEventAlreadyExists
	}

	s.events[eventType] = event
	return event, nil
}

func (s *GameScheduler) cancelEvent(eventType ScheduledEventType) error {
	if s.events[eventType] == nil {
		return ErrEventNotFound
	}

	delete(s.events, eventType)
	return nil
}

func (s *GameScheduler) clearEvents() {
	s.events = make(map[ScheduledEventType]*ScheduledEvent)
}
