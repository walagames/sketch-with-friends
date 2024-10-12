package main

import (
	"encoding/json"
	"log/slog"

	"fmt"
	"reflect"

	"github.com/mitchellh/mapstructure"
)

type ActionType string

const (
	// generic actions
	Error ActionType = "error"

	// client actions
	InitializeClient ActionType = "client/initializeClient"

	// Drawing actions
	AddStroke      ActionType = "canvas/addStroke"
	AddStrokePoint ActionType = "canvas/addStrokePoint"
	ClearStrokes   ActionType = "canvas/clearStrokes"
	UndoStroke     ActionType = "canvas/undoStroke"
	SetStrokes     ActionType = "canvas/setStrokes"

	// Game actions
	SetWord     ActionType = "game/setWord"     // picker sends real word, guessers get hinted word
	SubmitGuess ActionType = "game/submitGuess" // only sent from client
	WordOptions ActionType = "game/wordOptions" // only sent from server to picker
	StartGame   ActionType = "game/startGame"   // only sent to server from host
	GuessResult ActionType = "game/guessResult" // added to guess chat when a player guess is processed
	ChangePhase ActionType = "game/changePhase" // changes the game phase
	SelectWord  ActionType = "game/selectWord"  // picker selects a word from options
	SetRound    ActionType = "game/setRound"    // sets the current round number

	// Room actions
	InitializeRoom     ActionType = "room/initializeRoom" // send initial state to client including playerId and existing game state
	ChangeRoomSettings ActionType = "room/changeRoomSettings"
	SetPlayers         ActionType = "room/setPlayers"
	PlayerJoined       ActionType = "room/playerJoined"
	PlayerLeft         ActionType = "room/playerLeft"
	HostChanged        ActionType = "room/hostChanged"
	ChangeStage        ActionType = "room/changeStage"
)

// ActionDefinition struct to encapsulate action metadata
type ActionDefinition struct {
	Permission  RoomRole
	Role        GameRole
	PayloadType interface{}
	validator   func(room *room) error
	Execute     func(room *room, a *Action) error
	After       func(room *room, a *Action) error
}

// Update ActionType constants with metadata
var ActionDefinitions = map[ActionType]ActionDefinition{
	StartGame: {
		Permission:  RoomRoleHost,
		Role:        GameRoleAny,
		PayloadType: nil,
		validator: func(r *room) error {
			if !(r.Stage == PreGame || r.Stage == PostGame) {
				return fmt.Errorf("game can only be started in pre or post game stage")
			}
			if len(r.Players) < 2 {
				return fmt.Errorf("game can only be started with at least 2 players")
			}
			return nil
		},
		Execute: func(r *room, a *Action) error {
			slog.Info("starting game")
			r.Stage = Playing
			r.game = NewGameState(PickingPhase{}, r)
			r.game.initDrawQueue()
			r.game.currentPhase.Begin(r.game)
			return nil
		},
		After: func(r *room, a *Action) error {
			r.broadcast(GameRoleAny,
				message(ChangeStage, r.Stage),
			)
			return nil
		},
	},
	SelectWord: {
		Permission:  RoomRoleAny,
		Role:        GameRoleDrawing,
		PayloadType: "string",
		validator: func(r *room) error {
			// TODO: check if word is in options
			// TODO: check if word is already selected
			// TODO: check if timer is running
			// TODO: check if game is in picking phase
			// TODO: check if game is in playing stage
			return nil
		},
		Execute: func(r *room, a *Action) error {
			slog.Info("picker selected word", "word", a.Payload)
			return nil
		},
		After: func(r *room, a *Action) error {
			r.timer.Stop()
			r.game.currentWord = a.Payload.(string)
			r.game.Transition()
			return nil
		},
	},
	AddStroke: {
		Permission:  RoomRoleAny,
		Role:        GameRoleDrawing,
		PayloadType: map[string]interface{}{},
		validator: func(r *room) error {
			// TODO
			if r.game.currentDrawer == nil {
				return fmt.Errorf("no drawer found")
			}
			return nil
		},
		Execute: func(r *room, a *Action) error {
			stroke, err := decodeStroke(a.Payload)
			if err != nil {
				return fmt.Errorf("failed to decode stroke: %w", err)
			}
			r.game.strokes = append(r.game.strokes, stroke)
			return nil
		},
		After: func(r *room, a *Action) error {
			r.broadcast(GameRoleAny,
				message(AddStroke, a.Payload),
			)
			return nil
		},
	},
	AddStrokePoint: {
		Permission:  RoomRoleAny,
		Role:        GameRoleDrawing,
		PayloadType: []interface{}{},
		validator: func(r *room) error {
			// TODO
			if r.game.currentDrawer == nil {
				return fmt.Errorf("no drawer found")
			}
			if r.game.currentPhase.Name() != "drawing" {
				return fmt.Errorf("not in drawing phase")
			}
			return nil
		},
		Execute: func(r *room, a *Action) error {
			point, err := decodeStrokePoint(a.Payload)
			if err != nil {
				return fmt.Errorf("failed to decode stroke point: %w", err)
			}
			r.game.strokes = appendStrokePoint(r.game.strokes, point)
			return nil
		},
		After: func(r *room, a *Action) error {
			r.broadcast(GameRoleAny,
				message(AddStrokePoint, a.Payload),
			)
			return nil
		},
	},
	ClearStrokes: {
		Permission: RoomRoleAny,
		Role:       GameRoleDrawing,
		validator: func(r *room) error {
			// TODO
			return nil
		},
		Execute: func(r *room, a *Action) error {
			r.game.strokes = make([]Stroke, 0)
			return nil
		},
		After: func(r *room, a *Action) error {
			r.broadcast(GameRoleAny,
				message(ClearStrokes, nil),
			)
			return nil
		},
	},
	UndoStroke: {
		Permission: RoomRoleAny,
		Role:       GameRoleDrawing,
		validator: func(r *room) error {
			// TODO
			return nil
		},
		Execute: func(r *room, a *Action) error {
			r.game.strokes = removeLastStroke(r.game.strokes)
			return nil
		},
		After: func(r *room, a *Action) error {
			r.broadcast(GameRoleAny,
				message(UndoStroke, nil),
			)
			return nil
		},
	},
	SubmitGuess: {
		Permission:  RoomRoleAny,
		Role:        GameRoleGuessing,
		PayloadType: "string",
		validator: func(r *room) error {
			// TODO
			return nil
		},
		Execute: func(r *room, a *Action) error {
			// TODO
			if r.game.currentWord != a.Payload.(string) {
				return fmt.Errorf("guess does not match current word")
			}
			slog.Info("player guessed the word correctly", "playerId", a.Player.ID, "guess", a.Payload)
			return nil
		},
		After: func(r *room, a *Action) error {
			// TODO
			return nil
		},
	},
	ChangeRoomSettings: {
		Permission:  RoomRoleHost,
		Role:        GameRoleAny,
		PayloadType: map[string]interface{}{},
		validator: func(r *room) error {
			// TODO
			return nil
		},
		Execute: func(r *room, a *Action) error {
			// ! i hate this
			r.Settings.DrawingTimeAllowed = int(a.Payload.(map[string]interface{})["drawingTimeAllowed"].(float64))
			r.Settings.PlayerLimit = int(a.Payload.(map[string]interface{})["playerLimit"].(float64))
			r.Settings.TotalRounds = int(a.Payload.(map[string]interface{})["totalRounds"].(float64))
			return nil
		},
		After: func(r *room, a *Action) error {
			// TODO
			r.broadcast(GameRoleAny,
				message(ChangeRoomSettings, r.Settings),
			)
			return nil
		},
	},
}

type Action struct {
	Type    ActionType  `json:"type"`
	Payload interface{} `json:"payload"`
	Player  *player     `json:"-"`
}

func message(actionType ActionType, payload interface{}) *Action {
	return &Action{
		Type:    actionType,
		Payload: payload,
	}
}

func encode(actions []*Action) []byte {
	jsonBytes, err := json.Marshal(actions)
	if err != nil {
		slog.Error("error marshalling events", "error", err)
		return nil
	}
	return jsonBytes
}

func decode(bytes []byte) (*Action, error) {
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
		slog.Warn("failed to decode payload", "error", err)
		return target, err
	}
	return target, nil
}

// ValidateAction checks if the action is valid given the current game state
func (def *ActionDefinition) Before(room *room, a *Action) error {
	// Check permissions
	if def.Permission != RoomRoleAny && def.Permission != a.Player.RoomRole {
		return fmt.Errorf("player doesn't have required permission for action: %s", a.Type)
	}

	// Check roles
	if def.Role != GameRoleAny && def.Role != a.Player.GameRole {
		return fmt.Errorf("player doesn't have required role for action: %s", a.Type)
	}

	// Validate payload type
	if reflect.TypeOf(a.Payload) != reflect.TypeOf(def.PayloadType) {
		return fmt.Errorf("invalid payload type for action: %s, expected %s, got %s", a.Type, reflect.TypeOf(def.PayloadType), reflect.TypeOf(a.Payload))
	}

	// Check game state conditions
	return def.validator(room)
}
