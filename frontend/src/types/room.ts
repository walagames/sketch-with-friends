import { Stroke } from "./canvas";
import { Player } from "./player";
import { GameState } from "./game";

export enum RoomEventType {
	START_GAME = "START_GAME",
	STATE = "STATE",
	STROKE = "STROKE",
	STROKE_POINT = "STROKE_POINT",
	CLEAR_STATE = "CLEAR_STATE",
	CLEAR_STROKES = "CLEAR_STROKES",
	UNDO_STROKE = "UNDO_STROKE",
	PLAYER_JOINED = "PLAYER_JOINED",
	PLAYER_LEFT = "PLAYER_LEFT",
	HOST_CHANGED = "HOST_CHANGED",
	CHANGE_SETTINGS = "CHANGE_SETTINGS",
	GAME_STATE = "GAME_STATE",
	INITIALIZE_CLIENT = "INITIALIZE_CLIENT",
	GAME_STARTED = "GAME_STARTED",
	WORD_OPTIONS = "WORD_OPTIONS",
	PICK_WORD = "PICK_WORD",
	INITIALIZE_PLAYER_ID = "INITIALIZE_PLAYER_ID",
	GUESS = "GUESS",
	GUESS_RESPONSE = "GUESS_RESPONSE",
}

export type RoomState = {
	status: RoomStatus;
	code: string;
	players: Player[];
	game: GameState;
	settings: RoomSettings;
};

export type RoomSettings = {
	drawingTime: number;
	rounds: number;
	wordOptions: number;
	letterHints: number;
	playerLimit: number;
	isRoomOpen: boolean;
};

export enum RoomStatus {
	WAITING = "WAITING",
	PLAYING = "PLAYING",
	UNINITIALIZED = "UNINITIALIZED",
	FINISHED = "FINISHED",
}

export type RoomEvent =
	| StateEvent
	| StrokeEvent
	| StrokePointEvent
	| StartGameEvent
	| ClearStateEvent
	| ClearStrokesEvent
	| UndoStrokeEvent
	| PlayerJoinedEvent
	| PlayerLeftEvent
	| HostChangedEvent
	| GameStartedEvent
	| ChangeSettingsEvent
	| GameStateEvent
	| PickWordEvent
	| GuessEvent
	| GuessResponseEvent;

export type StateEvent = {
	type: RoomEventType.STATE;
	payload: RoomState;
};

export type StrokeEvent = {
	type: RoomEventType.STROKE;
	payload: Stroke;
};

export type StrokePointEvent = {
	type: RoomEventType.STROKE_POINT;
	payload: number[];
};

export type StartGameEvent = {
	type: RoomEventType.START_GAME;
};

export type ChangeSettingsEvent = {
	type: RoomEventType.CHANGE_SETTINGS;
	payload: {
		playerLimit: number;
		isRoomOpen: boolean;
		drawingTime: number;
		rounds: number;
	};
};

export type ClearStateEvent = {
	type: RoomEventType.CLEAR_STATE;
};

export type ClearStrokesEvent = {
	type: RoomEventType.CLEAR_STROKES;
};
export type UndoStrokeEvent = {
	type: RoomEventType.UNDO_STROKE;
};

export type PlayerJoinedEvent = {
	type: RoomEventType.PLAYER_JOINED;
	payload: Player;
};

export type PlayerLeftEvent = {
	type: RoomEventType.PLAYER_LEFT;
	payload: Player;
};

export type HostChangedEvent = {
	type: RoomEventType.HOST_CHANGED;
	payload: Player;
};

export type GameStateEvent = {
	type: RoomEventType.GAME_STATE;
	payload: GameState;
};

export type GameStartedEvent = {
	type: RoomEventType.GAME_STARTED;
	payload: string;
};

export type WordOptionsEvent = {
	type: RoomEventType.WORD_OPTIONS;
	payload: string[];
};

export type PickWordEvent = {
	type: RoomEventType.PICK_WORD;
	payload: string;
};

export type GuessEvent = {
	type: RoomEventType.GUESS;
	payload: string;
};

export type GuessResponseEvent = {
	type: RoomEventType.GUESS_RESPONSE;
	payload: boolean;
};