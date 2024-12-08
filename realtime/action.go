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
	AddElement         ActionType = "canvas/addElement"
	UpdateElement      ActionType = "canvas/updateElement"
	UndoElement        ActionType = "canvas/undoElement"
	ClearElements      ActionType = "canvas/clearElements"
	SetElements        ActionType = "canvas/setElements"
	UpdateStrokePoints ActionType = "canvas/updateStrokePoints"

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
				return fmt.Errorf("you can only start the game from the pre-game stage")
			}
			if len(r.Players) < 2 {
				return fmt.Errorf("you need at least 2 players to start the game")
			}
			if len(r.Settings.CustomWords) < 3 && r.Settings.WordBank == WordBankCustom {
				return fmt.Errorf("you need to provide at least 3 custom words in custom only mode")
			}
			return nil
		},
		execute: func(r *room, a *Action) error {
			r.setStage(Playing)

			// Initialize game state
			for _, p := range r.Players {
				p.GameRole = GameRoleGuessing
			}
			r.game = NewGame(&PickingPhase{}, r)
			r.game.fillDrawingQueue()
			r.game.currentPhase.Start(r.game)

			// Inform clients of the stage change
			r.broadcast(GameRoleAny,
				message(SetPlayers, r.Players),
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
	AddElement: {
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
			return nil
		},
		execute: func(r *room, a *Action) error {
			// If the game is not in the drawing phase, do nothing
			if r.game.currentPhase.Name() != Drawing {
				return nil
			}

			// Decode the element from the payload
			element, err := decodeCanvasElement(a.Payload)
			if err != nil {
				return fmt.Errorf("failed to decode stroke: %w", err)
			}

			// Add the element to the game state
			r.game.elements = append(r.game.elements, element)

			// Re-broadcast the element to the rest of the players
			r.broadcast(GameRoleGuessing,
				message(AddElement, a.Payload),
			)
			return nil
		},
	},
	UpdateElement: {
		RoomRoleRequired: RoomRoleAny,
		GameRoleRequired: GameRoleDrawing,
		PayloadType:      map[string]interface{}{},
		validator: func(r *room) error {
			if r.game == nil {
				return fmt.Errorf("game is not initialized")
			}
			if r.game.currentDrawer == nil {
				return fmt.Errorf("no drawer found")
			}
			return nil
		},
		execute: func(r *room, a *Action) error {
			// If the game is not in the drawing phase, do nothing
			if r.game.currentPhase.Name() != Drawing {
				return nil
			}

			// Decode the element from the payload
			element, err := decodeCanvasElement(a.Payload)
			if err != nil {
				return fmt.Errorf("failed to decode element: %w", err)
			}

			// Add the element to the game state
			r.game.elements = updateElement(r.game.elements, element)

			// Re-broadcast the element to the rest of the players
			r.broadcast(GameRoleGuessing,
				message(UpdateElement, a.Payload),
			)
			return nil
		},
	},
	ClearElements: {
		RoomRoleRequired: RoomRoleAny,
		GameRoleRequired: GameRoleDrawing,
		validator: func(r *room) error {
			if r.game == nil {
				return fmt.Errorf("game is not initialized")
			}
			if r.game.currentPhase.Name() != Drawing {
				return fmt.Errorf("not in drawing phase")
			}
			return nil
		},
		execute: func(r *room, a *Action) error {
			// Clear the elements from the game state
			r.game.elements = make([]CanvasElement, 0)

			// Tell the other players to clear their elements
			r.broadcast(GameRoleGuessing,
				message(ClearElements, nil),
			)
			return nil
		},
	},
	UndoElement: {
		RoomRoleRequired: RoomRoleAny,
		GameRoleRequired: GameRoleDrawing,
		validator: func(r *room) error {
			if r.game == nil {
				return fmt.Errorf("game is not initialized")
			}
			if r.game.currentPhase.Name() != Drawing {
				return fmt.Errorf("not in drawing phase")
			}
			return nil
		},
		execute: func(r *room, a *Action) error {
			// Remove the most recent element from the game state
			r.game.elements = undoElement(r.game.elements)

			// Tell the other players to undo their last stroke
			r.broadcast(GameRoleGuessing,
				message(UndoElement, nil),
			)
			return nil
		},
	},
	UpdateStrokePoints: {
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
			return nil
		},
		execute: func(r *room, a *Action) error {
			slog.Debug("UpdateStrokePoints action", "action", a)
			// If the game is not in the drawing phase, do nothing
			if r.game.currentPhase.Name() != Drawing {
				return nil
			}
	
			// Decode the stroke update from the payload
			update, err := decodePayload[StrokeUpdate](a.Payload)
			if err != nil {
				return fmt.Errorf("failed to decode stroke update: %w", err)
			}
	
			// Update the stroke points in the game state
			r.game.elements = updateStrokePoints(r.game.elements, update)
	
			// Re-broadcast the stroke update to the rest of the players
			r.broadcast(GameRoleGuessing,
				message(UpdateStrokePoints, a.Payload),
			)
			return nil
		},
	},
	SubmitGuess: {
		RoomRoleRequired: RoomRoleAny,
		GameRoleRequired: GameRoleAny,
		PayloadType:      "string",
		validator: func(r *room) error {
			if r.game == nil {
				return fmt.Errorf("game is not initialized")
			}
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
			rawCustomWords := a.Payload.(map[string]interface{})["customWords"].([]interface{})
			customWords := make([]string, len(rawCustomWords))
			for i, word := range rawCustomWords {
				customWords[i] = word.(string)
			}
			r.Settings.CustomWords = filterDuplicateWords(filterInvalidWords(customWords))

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
func encodeActions(actions []*Action) ([]byte, error) {
	jsonBytes, err := json.Marshal(actions)
	if err != nil {
		slog.Error("error marshalling events", "error", err)
		return nil, err
	}
	return jsonBytes, nil
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
