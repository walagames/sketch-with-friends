package main

import (
	"testing"
	"time"
)

func TestGameScheduler(t *testing.T) {
	scheduler := NewGameScheduler()

	// Track handler executions
	executionCount := 0
	handler := func() { executionCount++ }

	// Schedule a recurring event every 100ms
	scheduler.addReccuringEvent(ScheduledStateChange, 100*time.Millisecond, 1, handler)

	// Advance time by 250ms
	scheduler.tick(250 * time.Millisecond)

	if executionCount != 2 {
		t.Errorf("Expected 2 executions, got %d", executionCount)
	}
}
