import { Stroke } from "./canvas";
import { Player } from "./player";

export enum RoomEventType {
	START_GAME = "START_GAME",
	INITIAL_STATE = "INITIAL_STATE",
	NEW_STROKE = "NEW_STROKE",
	STROKE_POINT = "STROKE_POINT",
	CLEAR_STATE = "CLEAR_STATE",
	CLEAR_STROKES = "CLEAR_STROKES",
	UNDO_STROKE = "UNDO_STROKE",
}
export type RoomState = {
	status: RoomStatus;
	code: string;
	players: Player[];
	game: GameState;
};

export type GameState = {
	strokes: Stroke[];
};

export enum RoomStatus {
	WAITING = "WAITING",
	PLAYING = "PLAYING",
	FINISHED = "FINISHED",
}

export type InitialState = {
	type: RoomEventType.INITIAL_STATE;
	payload: RoomState;
};

export type RoomEvent = InitialState | NewStroke | StrokePoint | StartGame | ClearState | ClearStrokes | UndoStroke;

export type NewStroke = {
	type: RoomEventType.NEW_STROKE;
	payload: Stroke;
};

export type StrokePoint = {
	type: RoomEventType.STROKE_POINT;
	payload: number[];
};

export type StartGame = {
	type: RoomEventType.START_GAME;
	payload: {
		rounds: number;
		timeLimit: number;
	};
};

export type ClearState = {
	type: RoomEventType.CLEAR_STATE;
};

export type ClearStrokes = {
	type: RoomEventType.CLEAR_STROKES;
};
export type UndoStroke = {
	type: RoomEventType.UNDO_STROKE;
};

