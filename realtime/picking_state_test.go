package main

import (
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestPickingState_HandleCommand_WordSelection(t *testing.T) {
	wordOptions := []Word{
		{Value: "cat"},
		{Value: "dog"},
		{Value: "bird"},
	}

	tests := []struct {
		name          string
		gameRole      GameRole
		selectedWord  interface{}
		expectedError error
	}{
		{
			name:     "drawer can select valid word",
			gameRole: GameRoleDrawing,
			selectedWord: map[string]interface{}{
				"value": "cat",
			},
			expectedError: nil,
		},
		{
			name:     "guesser cannot select word",
			gameRole: GameRoleGuessing,
			selectedWord: map[string]interface{}{
				"value": "cat",
			},
			expectedError: ErrWrongGameRole,
		},
		{
			name:     "cannot select word not in options",
			gameRole: GameRoleDrawing,
			selectedWord: map[string]interface{}{
				"value": "elephant",
			},
			expectedError: fmt.Errorf("selected word is not a valid option"),
		},
		{
			name:          "invalid payload type",
			gameRole:      GameRoleDrawing,
			selectedWord:  "cat", // String instead of map
			expectedError: fmt.Errorf("invalid word selection: invalid payload format: expected map[string]interface{}"),
		},
		{
			name:     "invalid word format - missing value",
			gameRole: GameRoleDrawing,
			selectedWord: map[string]interface{}{
				"wrong_key": "cat",
			},
			expectedError: fmt.Errorf("invalid word selection: invalid word format: 'value' field must be a string"),
		},
		{
			name:     "invalid word format - empty value",
			gameRole: GameRoleDrawing,
			selectedWord: map[string]interface{}{
				"value": "",
			},
			expectedError: fmt.Errorf("invalid word selection: invalid word: value cannot be empty"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			state := &PickingState{
				wordOptions:  wordOptions,
				selectedWord: nil,
				endsAt:       time.Now().Add(15 * time.Second),
			}

			room := &room{
				Players: map[uuid.UUID]*player{
					uuid.New(): {RoomRole: RoomRolePlayer, client: NewClient(nil, nil, nil)},
					uuid.New(): {RoomRole: RoomRolePlayer, client: NewClient(nil, nil, nil)},
				},
				scheduler:    NewGameScheduler(),
				currentState: state,
			}

			// Create command
			cmd := &Command{
				Type: SelectWordCmd,
				Player: &player{
					ID:       uuid.New(),
					GameRole: tt.gameRole,
				},
				Payload: tt.selectedWord,
			}

			// Execute
			err := state.HandleCommand(room, cmd)

			// Assert
			if tt.expectedError == nil {
				if err != nil {
					t.Errorf("expected no error, got %v", err)
				}
				// Check that the word was selected
				if state.selectedWord == nil || state.selectedWord.Value != "cat" {
					t.Errorf("word was not selected correctly")
				}
			} else {
				if err == nil || err.Error() != tt.expectedError.Error() {
					t.Errorf("expected error %v, got %v", tt.expectedError, err)
				}
			}
		})
	}
}
