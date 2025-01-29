package main

import (
	"testing"

	"github.com/google/uuid"
)

func TestWaitingState_HandleCommand_StartGame_RolePermissions(t *testing.T) {
	tests := []struct {
		name          string
		playerRole    RoomRole
		expectedError error
	}{
		{
			name:          "host can start game",
			playerRole:    RoomRoleHost,
			expectedError: nil,
		},
		{
			name:          "regular player cannot start game",
			playerRole:    RoomRolePlayer,
			expectedError: ErrWrongRoomRole,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			room := &room{
				Players: map[uuid.UUID]*player{
					uuid.New(): {RoomRole: RoomRolePlayer},
					uuid.New(): {RoomRole: RoomRolePlayer},
				},
				Settings: RoomSettings{
					WordBank:           WordBankDefault,
					CustomWords:        []Word{},
					DrawingTimeAllowed: 90,
					TotalRounds:        3,
					WordDifficulty:     WordDifficultyAll,
				},
				currentState: NewWaitingState(),
				scheduler:    NewGameScheduler(),
			}

			// Create command from player with specific role
			cmd := &Command{
				Type: StartGameCmd,
				Player: &player{
					ID:       uuid.New(),
					RoomRole: tt.playerRole,
				},
			}

			// Execute
			err := room.currentState.HandleCommand(room, cmd)

			// Assert
			if err != tt.expectedError {
				t.Errorf("expected error %v, got %v", tt.expectedError, err)
			}
		})
	}
}

func TestWaitingState_HandleCommand_StartGame_Requirements(t *testing.T) {
	tests := []struct {
		name          string
		players       int
		wordBank      WordBank
		customWords   []Word
		expectedError error
	}{
		{
			name:          "can start with 2 players and default word bank",
			players:       2,
			wordBank:      WordBankDefault,
			customWords:   nil,
			expectedError: nil,
		},
		{
			name:          "cannot start with 1 player",
			players:       1,
			wordBank:      WordBankDefault,
			customWords:   nil,
			expectedError: ErrNotEnoughPlayers,
		},
		{
			name:          "can start with custom words if enough provided",
			players:       2,
			wordBank:      WordBankCustom,
			customWords:   []Word{{Value: "word1"}, {Value: "word2"}, {Value: "word3"}},
			expectedError: nil,
		},
		{
			name:          "cannot start with custom words if not enough provided",
			players:       2,
			wordBank:      WordBankCustom,
			customWords:   []Word{{Value: "word1"}, {Value: "word2"}},
			expectedError: ErrNotEnoughCustomWords,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup room with specified number of players
			players := make(map[uuid.UUID]*player)
			for i := 0; i < tt.players; i++ {
				players[uuid.New()] = &player{RoomRole: RoomRolePlayer}
			}

			room := &room{
				Players: players,
				Settings: RoomSettings{
					WordBank:           tt.wordBank,
					CustomWords:        tt.customWords,
					DrawingTimeAllowed: 90,
					TotalRounds:        3,
					WordDifficulty:     WordDifficultyAll,
				},
				currentState: NewWaitingState(),
				scheduler:    NewGameScheduler(),
			}

			// Create command from host
			cmd := &Command{
				Type: StartGameCmd,
				Player: &player{
					ID:       uuid.New(),
					RoomRole: RoomRoleHost,
				},
			}

			// Execute
			err := room.currentState.HandleCommand(room, cmd)

			// Assert
			if err != tt.expectedError {
				t.Errorf("expected error %v, got %v", tt.expectedError, err)
			}
		})
	}
}

func TestWaitingState_HandleCommand_ChangeRoomSettings_Validation(t *testing.T) {
	tests := []struct {
		name          string
		settings      RoomSettings
		expectedError bool
	}{
		{
			name: "valid settings",
			settings: RoomSettings{
				WordBank:           WordBankDefault,
				DrawingTimeAllowed: 90,
				TotalRounds:        3,
				PlayerLimit:        6,
				WordDifficulty:     WordDifficultyAll,
				GameMode:           GameModeClassic,
			},
			expectedError: false,
		},
		{
			name: "invalid drawing time - too low",
			settings: RoomSettings{
				WordBank:           WordBankDefault,
				DrawingTimeAllowed: 10, // Below MIN_DRAWING_TIME
				TotalRounds:        3,
				PlayerLimit:        6,
				WordDifficulty:     WordDifficultyAll,
				GameMode:           GameModeClassic,
			},
			expectedError: true,
		},
		{
			name: "invalid drawing time - too high",
			settings: RoomSettings{
				WordBank:           WordBankDefault,
				DrawingTimeAllowed: 300, // Above MAX_DRAWING_TIME
				TotalRounds:        3,
				PlayerLimit:        6,
				WordDifficulty:     WordDifficultyAll,
				GameMode:           GameModeClassic,
			},
			expectedError: true,
		},
		{
			name: "invalid player limit - too low",
			settings: RoomSettings{
				WordBank:           WordBankDefault,
				DrawingTimeAllowed: 90,
				TotalRounds:        3,
				PlayerLimit:        1, // Below MIN_PLAYERS
				WordDifficulty:     WordDifficultyAll,
				GameMode:           GameModeClassic,
			},
			expectedError: true,
		},
		{
			name: "invalid player limit - too high",
			settings: RoomSettings{
				WordBank:           WordBankDefault,
				DrawingTimeAllowed: 90,
				TotalRounds:        3,
				PlayerLimit:        15, // Above MAX_PLAYERS
				WordDifficulty:     WordDifficultyAll,
				GameMode:           GameModeClassic,
			},
			expectedError: true,
		},
		{
			name: "invalid rounds - too low",
			settings: RoomSettings{
				WordBank:           WordBankDefault,
				DrawingTimeAllowed: 90,
				TotalRounds:        0, // Below MIN_ROUNDS
				PlayerLimit:        6,
				WordDifficulty:     WordDifficultyAll,
				GameMode:           GameModeClassic,
			},
			expectedError: true,
		},
		{
			name: "invalid rounds - too high",
			settings: RoomSettings{
				WordBank:           WordBankDefault,
				DrawingTimeAllowed: 90,
				TotalRounds:        15, // Above MAX_ROUNDS
				PlayerLimit:        6,
				WordDifficulty:     WordDifficultyAll,
				GameMode:           GameModeClassic,
			},
			expectedError: true,
		},
		{
			name: "invalid word bank",
			settings: RoomSettings{
				WordBank:           "invalid",
				DrawingTimeAllowed: 90,
				TotalRounds:        3,
				PlayerLimit:        6,
				WordDifficulty:     WordDifficultyAll,
				GameMode:           GameModeClassic,
			},
			expectedError: true,
		},
		{
			name: "invalid game mode",
			settings: RoomSettings{
				WordBank:           WordBankDefault,
				DrawingTimeAllowed: 90,
				TotalRounds:        3,
				PlayerLimit:        6,
				WordDifficulty:     WordDifficultyAll,
				GameMode:           "invalid",
			},
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			room := &room{
				Players: map[uuid.UUID]*player{
					uuid.New(): {RoomRole: RoomRolePlayer, client: NewClient(nil, nil, nil)},
					uuid.New(): {RoomRole: RoomRolePlayer, client: NewClient(nil, nil, nil)},
				},
				Settings: RoomSettings{
					WordBank:           WordBankDefault,
					DrawingTimeAllowed: 90,
					TotalRounds:        3,
					WordDifficulty:     WordDifficultyAll,
				},
				currentState: NewWaitingState(),
				scheduler:    NewGameScheduler(),
			}

			cmd := &Command{
				Type: ChangeRoomSettingsCmd,
				Player: &player{
					ID:       uuid.New(),
					RoomRole: RoomRoleHost,
				},
				Payload: tt.settings,
			}

			err := room.currentState.HandleCommand(room, cmd)

			if (err != nil) != tt.expectedError {
				t.Errorf("expected error %v, got %v", tt.expectedError, err)
			}
		})
	}
}

func TestWaitingState_HandleCommand_ChangeRoomSettings_RolePermissions(t *testing.T) {
	tests := []struct {
		name          string
		playerRole    RoomRole
		expectedError error
	}{
		{
			name:          "host can change room settings",
			playerRole:    RoomRoleHost,
			expectedError: nil,
		},
		{
			name:          "regular player cannot change room settings",
			playerRole:    RoomRolePlayer,
			expectedError: ErrWrongRoomRole,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			playerId := uuid.New()
			// Setup
			room := &room{
				Players: map[uuid.UUID]*player{
					playerId:   {RoomRole: RoomRolePlayer, client: NewClient(nil, nil, nil)},
					uuid.New(): {RoomRole: RoomRolePlayer, client: NewClient(nil, nil, nil)},
				},
				Settings: RoomSettings{
					WordBank:           WordBankDefault,
					CustomWords:        []Word{},
					DrawingTimeAllowed: 90,
					TotalRounds:        3,
					WordDifficulty:     WordDifficultyAll,
				},
				currentState: NewWaitingState(),
				scheduler:    NewGameScheduler(),
			}

			// Create command from player with specific role
			cmd := &Command{
				Type: ChangeRoomSettingsCmd,
				Player: &player{
					ID:       playerId,
					RoomRole: tt.playerRole,
				},
				Payload: RoomSettings{
					WordBank:           WordBankDefault,
					CustomWords:        []Word{},
					DrawingTimeAllowed: 90,
					TotalRounds:        3,
					PlayerLimit:        6,
					WordDifficulty:     WordDifficultyAll,
					GameMode:           GameModeClassic,
				},
			}

			// Execute
			err := room.currentState.HandleCommand(room, cmd)

			// Assert
			if err != tt.expectedError {
				t.Errorf("expected error %v, got %v", tt.expectedError, err)
			}
		})
	}
}
