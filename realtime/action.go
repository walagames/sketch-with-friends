package main

import (
	"encoding/json"
	"log/slog"

	"fmt"
	"reflect"

	"github.com/mitchellh/mapstructure"
)

// Action types are used to identify the action being performed.
// These types are designed to closely mirror the Redux actions on the frontend,
// facilitating simpler state synchronization between the client and server.
type ActionType string

const (
	// Generic message types to trigger alert messages on frontend
	Error   ActionType = "error"
	Warning ActionType = "warning"
	Info    ActionType = "info"

	// Client actions
	InitializeClient ActionType = "client/initializeClient"

	// Canvas actions
	AddStroke      ActionType = "canvas/addStroke"
	AddStrokePoint ActionType = "canvas/addStrokePoint"
	ClearStrokes   ActionType = "canvas/clearStrokes"
	UndoStroke     ActionType = "canvas/undoStroke"
	SetStrokes     ActionType = "canvas/setStrokes"

	// Game actions
	SetWord       ActionType = "game/setWord"
	SubmitGuess   ActionType = "game/submitGuess"
	WordOptions   ActionType = "game/wordOptions"
	StartGame     ActionType = "game/startGame"
	GuessResult   ActionType = "game/guessResult"
	ClearGuesses  ActionType = "game/clearGuesses"
	SetGuesses    ActionType = "game/setGuesses"
	ChangePhase   ActionType = "game/changePhase"
	SelectWord    ActionType = "game/selectWord"
	SetRound      ActionType = "game/setRound"
	PointsAwarded ActionType = "game/pointsAwarded"

	// Room actions
	InitializeRoom     ActionType = "room/initializeRoom"
	ChangeRoomSettings ActionType = "room/changeRoomSettings"
	SetPlayers         ActionType = "room/setPlayers"
	PlayerJoined       ActionType = "room/playerJoined"
	PlayerLeft         ActionType = "room/playerLeft"
	HostChanged        ActionType = "room/hostChanged"
	ChangeStage        ActionType = "room/changeStage"
)

// Action are used to communicate between the client and server.
type Action struct {
	Type    ActionType  `json:"type"`
	Payload interface{} `json:"payload"`
	Player  *player     `json:"-"`
}

// Action Definitions help encapsulate the logic for validating preconditions and performing actions.
//
// Before performing actions we usually want to:
// 1. Check if the actor has permission to perform that action ex. only host can change settings
// 2. Check if the game state allows the action to be performed ex. can't submit guess if not in guessing phase
// 3. Perform any side effects related to the action ex. change game state, update player scores
// 4. Inform clients of the action or state changes ex. re-broadcast a stroke point to guessing players
//
// Action definitions help us encapsulate this logic in a single place, reducing code duplication and improving readability.
type ActionDefinition struct {
	RoomRoleRequired RoomRole
	GameRoleRequired GameRole
	PayloadType      interface{}
	validator        func(room *room) error
	execute          func(room *room, a *Action) error
}

// ValidateAction checks if the action is valid given the current game state
func (def *ActionDefinition) ValidateAction(room *room, a *Action) error {
	// Check permissions
	if def.RoomRoleRequired != RoomRoleAny && def.RoomRoleRequired != a.Player.RoomRole {
		return fmt.Errorf("player doesn't have required permission for action: %s", a.Type)
	}

	// Check roles
	if def.GameRoleRequired != GameRoleAny && def.GameRoleRequired != a.Player.GameRole {
		return fmt.Errorf("player doesn't have required role for action: %s", a.Type)
	}

	// Validate payload type
	if reflect.TypeOf(a.Payload) != reflect.TypeOf(def.PayloadType) {
		return fmt.Errorf("invalid payload type for action: %s, expected %s, got %s", a.Type, reflect.TypeOf(def.PayloadType), reflect.TypeOf(a.Payload))
	}

	// Check game state conditions
	return def.validator(room)
}

var ActionDefinitions = map[ActionType]ActionDefinition{
	StartGame: {
		RoomRoleRequired: RoomRoleHost,
		GameRoleRequired: GameRoleAny,
		PayloadType:      nil,
		validator: func(r *room) error {
			if r.Stage != PreGame {
				return fmt.Errorf("can only start game in pre game stage")
			}
			if len(r.Players) < 2 {
				return fmt.Errorf("can only start game with at least 2 players")
			}
			return nil
		},
		execute: func(r *room, a *Action) error {
			r.setStage(Playing)

			// Initialize game state
			r.game = NewGame(&PickingPhase{}, r)
			r.game.fillDrawingQueue()
			r.game.currentPhase.Start(r.game)

			// Inform clients of the stage change
			r.broadcast(GameRoleAny,
				message(ChangeStage, r.Stage),
			)

			return nil
		},
	},
	SelectWord: {
		RoomRoleRequired: RoomRoleAny,
		GameRoleRequired: GameRoleDrawing,
		PayloadType:      "string",
		validator: func(r *room) error {
			if r.game == nil {
				return fmt.Errorf("game is not initialized")
			}
			if r.Stage != Playing {
				return fmt.Errorf("game is not in playing stage")
			}
			if r.game.currentPhase.Name() != Picking {
				return fmt.Errorf("game is not in picking phase")
			}
			if r.game.currentWord != nil {
				return fmt.Errorf("word already selected")
			}

			return nil
		},
		execute: func(r *room, a *Action) error {
			r.timer.Stop()

			// Check if selected word is actually an option
			selectedWord := a.Payload.(string)
			var foundDrawingWord *DrawingWord
			for _, option := range r.game.wordOptions {
				if option.Value == selectedWord {
					foundDrawingWord = &option
					break
				}
			}
			if foundDrawingWord == nil {
				return fmt.Errorf("selected word is not a valid option")
			}

			// Start drawing phase
			r.game.currentWord = foundDrawingWord
			r.game.currentPhase.Next(r.game)

			return nil
		},
	},
	AddStroke: {
		RoomRoleRequired: RoomRoleAny,
		GameRoleRequired: GameRoleDrawing,
		PayloadType:      map[string]interface{}{},
		validator: func(r *room) error {
			if r.game == nil {
				return fmt.Errorf("game is not initialized")
			}
			if r.Stage != Playing {
				return fmt.Errorf("game is not in playing stage")
			}
			if r.game.currentPhase.Name() != Drawing {
				return fmt.Errorf("not in drawing phase")
			}
			return nil
		},
		execute: func(r *room, a *Action) error {
			// Decode the stroke from the payload
			stroke, err := decodeStroke(a.Payload)
			if err != nil {
				return fmt.Errorf("failed to decode stroke: %w", err)
			}

			// Add the stroke to the game state
			r.game.strokes = append(r.game.strokes, stroke)

			// Re-broadcast the stroke to the rest of the players
			r.broadcast(GameRoleGuessing,
				message(AddStroke, a.Payload),
			)
			return nil
		},
	},
	AddStrokePoint: {
		RoomRoleRequired: RoomRoleAny,
		GameRoleRequired: GameRoleDrawing,
		PayloadType:      []interface{}{},
		validator: func(r *room) error {
			if r.game.currentDrawer == nil {
				return fmt.Errorf("no drawer found")
			}
			if r.game.currentPhase.Name() != Drawing {
				return fmt.Errorf("not in drawing phase")
			}
			return nil
		},
		execute: func(r *room, a *Action) error {
			// Decode the stroke point from the payload
			point, err := decodeStrokePoint(a.Payload)
			if err != nil {
				return fmt.Errorf("failed to decode stroke point: %w", err)
			}

			// Add the stroke point to the most recent stroke
			r.game.strokes = appendStrokePoint(r.game.strokes, point)

			// Re-broadcast the stroke point to the rest of the players
			r.broadcast(GameRoleGuessing,
				message(AddStrokePoint, a.Payload),
			)
			return nil
		},
	},
	ClearStrokes: {
		RoomRoleRequired: RoomRoleAny,
		GameRoleRequired: GameRoleDrawing,
		validator: func(r *room) error {
			if r.game.currentPhase.Name() != Drawing {
				return fmt.Errorf("not in drawing phase")
			}
			return nil
		},
		execute: func(r *room, a *Action) error {
			// Clear the strokes from the game state
			r.game.strokes = make([]Stroke, 0)

			// Tell the other players to clear their strokes
			r.broadcast(GameRoleGuessing,
				message(ClearStrokes, nil),
			)
			return nil
		},
	},
	UndoStroke: {
		RoomRoleRequired: RoomRoleAny,
		GameRoleRequired: GameRoleDrawing,
		validator: func(r *room) error {
			if r.game.currentPhase.Name() != Drawing {
				return fmt.Errorf("not in drawing phase")
			}
			return nil
		},
		execute: func(r *room, a *Action) error {
			// Remove the most recent stroke from the game state
			r.game.strokes = removeLastStroke(r.game.strokes)

			// Tell the other players to undo their last stroke
			r.broadcast(GameRoleGuessing,
				message(UndoStroke, nil),
			)
			return nil
		},
	},
	SubmitGuess: {
		RoomRoleRequired: RoomRoleAny,
		GameRoleRequired: GameRoleGuessing,
		PayloadType:      "string",
		validator: func(r *room) error {
			if r.game.currentPhase.Name() != Drawing {
				return fmt.Errorf("not in guessing phase")
			}
			if r.Stage != Playing {
				return fmt.Errorf("game is not active")
			}
			return nil
		},
		execute: func(r *room, a *Action) error {
			guess := sanitizeGuess(a.Payload.(string))
			if guess == "" {
				return fmt.Errorf("invalid guess")
			}
			r.game.judgeGuess(a.Player.ID, guess)
			return nil
		},
	},
	ChangeRoomSettings: {
		RoomRoleRequired: RoomRoleHost,
		GameRoleRequired: GameRoleAny,
		PayloadType:      map[string]interface{}{},
		validator: func(r *room) error {
			// TODO: validate settings inputs
			if r.Stage != PreGame {
				return fmt.Errorf("can only change room settings in pre game stage")
			}
			return nil
		},
		execute: func(r *room, a *Action) error {
			// ! need a better way to do this
			r.Settings.DrawingTimeAllowed = int(a.Payload.(map[string]interface{})["drawingTimeAllowed"].(float64))
			r.Settings.PlayerLimit = int(a.Payload.(map[string]interface{})["playerLimit"].(float64))
			r.Settings.TotalRounds = int(a.Payload.(map[string]interface{})["totalRounds"].(float64))
			r.Settings.WordDifficulty = WordDifficulty(a.Payload.(map[string]interface{})["wordDifficulty"].(string))
			r.Settings.WordBank = WordBank(a.Payload.(map[string]interface{})["wordBank"].(string))
			r.Settings.GameMode = GameMode(a.Payload.(map[string]interface{})["gameMode"].(string))
			customWords := a.Payload.(map[string]interface{})["customWords"].([]interface{})
			slice := make([]string, len(customWords))
			for i, word := range customWords {
				slice[i] = word.(string)
			}
			r.Settings.CustomWords = filterInvalidWords(slice)

			// Inform clients of the room settings change
			r.broadcast(GameRoleAny,
				message(ChangeRoomSettings, r.Settings),
			)
			return nil
		},
	},
}

// Construct an action message
// It's named "message" instead of "action" to make it easier to read when used in broadcasts
func message(actionType ActionType, payload interface{}) *Action {
	return &Action{
		Type:    actionType,
		Payload: payload,
	}
}

// Encode a slice of actions into a JSON byte slice
func encodeActions(actions []*Action) []byte {
	jsonBytes, err := json.Marshal(actions)
	if err != nil {
		slog.Error("error marshalling events", "error", err)
		return nil
	}
	return jsonBytes
}

// Decode a JSON byte slice into an action
func decodeAction(bytes []byte) (*Action, error) {
	var action *Action
	err := json.Unmarshal(bytes, &action)
	if err != nil {
		slog.Error("error unmarshalling events", "error", err)
		return nil, err
	}
	return action, nil
}

// Decode event payload into a target type
func decodePayload[T any](payload interface{}) (T, error) {
	var target T
	err := mapstructure.Decode(payload, &target)
	if err != nil {
		slog.Debug("failed to decode payload", "error", err)
		return target, err
	}
	return target, nil
}
