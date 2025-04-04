package main

import (
	"strings"
	"testing"

	"github.com/google/uuid"
)

func TestDrawingState_Permissions(t *testing.T) {
	// Setup test room and state

	drawer := &player{
		ID:       uuid.New(),
		GameRole: GameRoleDrawing,
		RoomRole: RoomRolePlayer,
		client:   NewClient(nil, nil, nil),
	}
	guesser := &player{
		ID:       uuid.New(),
		GameRole: GameRoleGuessing,
		RoomRole: RoomRolePlayer,
		client:   NewClient(nil, nil, nil),
	}

	testRoom := &room{
		ID: uuid.New().String(),
		Players: map[uuid.UUID]*player{
			drawer.ID:  drawer,
			guesser.ID: guesser,
		},
		Settings: RoomSettings{
			PlayerLimit: 10,
		},
		currentDrawer: drawer,
		currentState:  NewDrawingState(Word{Value: "test", Difficulty: WordDifficultyEasy}),
	}

	tests := []struct {
		name       string
		command    *Command
		player     *player
		wantErr    bool
		errMessage string
	}{
		{
			name: "drawer can add stroke",
			command: &Command{
				Type: AddStrokeCmd,
				Payload: map[string]interface{}{
					"color": "#000000",
					"width": 5,
					"type":  "brush",
				},
			},
			player:  drawer,
			wantErr: false,
		},
		{
			name: "guesser cannot add stroke",
			command: &Command{
				Type: AddStrokeCmd,
				Payload: map[string]interface{}{
					"color": "#000000",
					"width": 5,
					"type":  "brush",
				},
			},
			player:     guesser,
			wantErr:    true,
			errMessage: ErrOnlyDrawerCanAddStrokes.Error(),
		},
		{
			name: "drawer can add stroke point",
			command: &Command{
				Type:    AddStrokePointCmd,
				Payload: []interface{}{100, 100},
			},
			player:  drawer,
			wantErr: false,
		},
		{
			name: "guesser cannot add stroke point",
			command: &Command{
				Type:    AddStrokePointCmd,
				Payload: []interface{}{100, 100},
			},
			player:     guesser,
			wantErr:    true,
			errMessage: ErrOnlyDrawerCanAddStrokePoints.Error(),
		},
		{
			name: "drawer can clear strokes",
			command: &Command{
				Type: ClearStrokesCmd,
			},
			player:  drawer,
			wantErr: false,
		},
		{
			name: "guesser cannot clear strokes",
			command: &Command{
				Type: ClearStrokesCmd,
			},
			player:     guesser,
			wantErr:    true,
			errMessage: ErrOnlyDrawerCanClearStrokes.Error(),
		},
		{
			name: "drawer can undo stroke",
			command: &Command{
				Type: UndoStrokeCmd,
			},
			player:  drawer,
			wantErr: false,
		},
		{
			name: "guesser cannot undo stroke",
			command: &Command{
				Type: UndoStrokeCmd,
			},
			player:     guesser,
			wantErr:    true,
			errMessage: ErrOnlyDrawerCanUndoStroke.Error(),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.command.Player = tt.player
			err := testRoom.currentState.HandleCommand(testRoom, tt.command)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error, got nil")
				} else if tt.errMessage != "" && !strings.Contains(err.Error(), tt.errMessage) {
					t.Errorf("error message %q does not contain %q", err.Error(), tt.errMessage)
				}
			} else if err != nil {
				t.Errorf("unexpected error: %v", err)
			}
		})
	}
}
