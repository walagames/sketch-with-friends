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
	SetWord           ActionType = "game/setWord"
	NewChatMessage    ActionType = "game/newChatMessage"
	WordOptions       ActionType = "game/wordOptions"
	StartGame         ActionType = "game/startGame"
	SubmitChatMessage ActionType = "game/submitChatMessage"
	ClearChat         ActionType = "game/clearChat"
	SetChat           ActionType = "game/setChat"
	ChangePhase       ActionType = "game/changePhase"
	SelectWord        ActionType = "game/selectWord"
	SetRound          ActionType = "game/setRound"
	PointsAwarded     ActionType = "game/pointsAwarded"

	// Room actions
	InitializeRoom      ActionType = "room/initializeRoom"
	ChangeRoomSettings  ActionType = "room/changeRoomSettings"
	SetPlayers          ActionType = "room/setPlayers"
	PlayerJoined        ActionType = "room/playerJoined"
	PlayerLeft          ActionType = "room/playerLeft"
	HostChanged         ActionType = "room/hostChanged"
	ChangeStage         ActionType = "room/changeStage"
	ChangePlayerProfile ActionType = "room/changePlayerProfile"
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

// Room settings validation constants
const (
	MIN_PLAYERS      = 2
	MAX_PLAYERS      = 10
	MIN_DRAWING_TIME = 15  // seconds
	MAX_DRAWING_TIME = 240 // seconds
	MIN_ROUNDS       = 1
	MAX_ROUNDS       = 10
)

var DefaultAvatarConfig = &AvatarConfig{
	HairStyle:       "bangs",
	HairColor:       "ff543d",
	Mood:            "hopeful",
	SkinColor:       "ffd6c0",
	BackgroundColor: "e0da29",
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
				p.Score = 0
				p.Streak = 0
			}

			r.game = NewGame(&PickingPhase{}, r)
			r.game.fillDrawingQueue()
			r.game.currentPhase.Start(r.game)

			// Inform clients of the stage change
			r.broadcast(GameRoleAny,
				action(SetPlayers, r.Players),
				action(ChangeStage, r.Stage),
				action(SetChat, r.game.chatMessages),
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
			return nil
		},
		execute: func(r *room, a *Action) error {
			// If the game is not in the drawing phase, do nothing
			if r.game.currentPhase.Name() != Drawing {
				return nil
			}

			// Decode the stroke from the payload
			stroke, err := decodeStroke(a.Payload)
			if err != nil {
				return fmt.Errorf("failed to decode stroke: %w", err)
			}

			// Add the stroke to the game state
			r.game.strokes = append(r.game.strokes, stroke)

			// Re-broadcast the stroke to the rest of the players
			r.broadcast(GameRoleGuessing,
				action(AddStroke, a.Payload),
			)
			return nil
		},
	},
	AddStrokePoint: {
		RoomRoleRequired: RoomRoleAny,
		GameRoleRequired: GameRoleDrawing,
		PayloadType:      []interface{}{},
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

			// Decode the stroke point from the payload
			point, err := decodeStrokePoint(a.Payload)
			if err != nil {
				return fmt.Errorf("failed to decode stroke point: %w", err)
			}

			// Add the stroke point to the most recent stroke
			r.game.strokes = appendStrokePoint(r.game.strokes, point)

			// Re-broadcast the stroke point to the rest of the players
			r.broadcast(GameRoleGuessing,
				action(AddStrokePoint, a.Payload),
			)
			return nil
		},
	},
	ClearStrokes: {
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
			// Clear the strokes from the game state
			r.game.strokes = make([]Stroke, 0)

			// Tell the other players to clear their strokes
			r.broadcast(GameRoleGuessing,
				action(ClearStrokes, nil),
			)
			return nil
		},
	},
	UndoStroke: {
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
			// Remove the most recent stroke from the game state
			r.game.strokes = removeLastStroke(r.game.strokes)

			// Tell the other players to undo their last stroke
			r.broadcast(GameRoleGuessing,
				action(UndoStroke, nil),
			)
			return nil
		},
	},
	SubmitChatMessage: {
		RoomRoleRequired: RoomRoleAny,
		GameRoleRequired: GameRoleAny,
		PayloadType:      "string",
		validator: func(r *room) error {
			if r.game == nil {
				return fmt.Errorf("game is not initialized")
			}
			if r.Stage != Playing {
				return fmt.Errorf("game is not active")
			}
			return nil
		},
		execute: func(r *room, a *Action) error {
			slog.Debug("New chat message", "message", a.Payload)
			msg := sanitizeGuess(a.Payload.(string))
			if msg == "" {
				return fmt.Errorf("invalid msg")
			}
			r.game.judgeGuess(a.Player.ID, msg)
			return nil
		},
	},
	ChangeRoomSettings: {
		RoomRoleRequired: RoomRoleHost,
		GameRoleRequired: GameRoleAny,
		PayloadType:      map[string]interface{}{},
		validator: func(r *room) error {
			if r.Stage != PreGame {
				return fmt.Errorf("can only change room settings in pre game stage")
			}
			return nil
		},
		execute: func(r *room, a *Action) error {
			settings, err := decodePayload[RoomSettings](a.Payload)
			if err != nil {
				return fmt.Errorf("failed to decode room settings: %w", err)
			}

			// Validate the settings before applying them
			if err := validateRoomSettings(&settings); err != nil {
				return fmt.Errorf("invalid room settings: %w", err)
			}

			// Update room settings
			r.Settings = settings
			r.Settings.CustomWords = filterDuplicateWords(filterInvalidWords(settings.CustomWords))

			// Inform clients of the room settings change
			r.broadcast(GameRoleAny,
				action(ChangeRoomSettings, r.Settings),
			)
			return nil
		},
	},
	ChangePlayerProfile: {
		RoomRoleRequired: RoomRoleAny,
		GameRoleRequired: GameRoleAny,
		PayloadType:      map[string]interface{}{},
		validator: func(r *room) error {
			return nil // No special room state validation needed
		},
		execute: func(r *room, a *Action) error {
			// Decode the payload
			profile, err := decodePayload[playerProfile](a.Payload)
			if err != nil {
				return fmt.Errorf("invalid player profile payload: %w", err)
			}

			// Validate and sanitize the profile
			validatedProfile, err := validatePlayerProfile(&profile)
			if err != nil {
				return fmt.Errorf("profile validation failed: %w", err)
			}

			// Show join message if new player
			if a.Player.Profile.Username == "" && r.game != nil {
				r.game.SendSystemMessage(fmt.Sprintf("%s joined the room", validatedProfile.Username))
			}

			// Update the player's profile with validated data
			a.Player.Profile = *validatedProfile

			// Broadcast the change to all players
			r.broadcast(GameRoleAny,
				action(SetPlayers, r.Players),
			)
			return nil
		},
	},
}

// Construct an action
func action(actionType ActionType, payload interface{}) *Action {
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

// Decode action payload into a target type
func decodePayload[T any](payload interface{}) (T, error) {
	var target T
	err := mapstructure.Decode(payload, &target)
	if err != nil {
		slog.Debug("failed to decode payload", "error", err)
		return target, err
	}
	return target, nil
}
