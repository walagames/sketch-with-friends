import { Stroke } from "./canvas";
import { Player } from "./player";

export enum RoomEventType {
	INITIAL_STATE = "INITIAL_STATE",
	NEW_STROKE = "NEW_STROKE",
	STROKE_POINT = "STROKE_POINT",
}
export type RoomState = {
	code: string;
	players: Player[];
	strokes: Stroke[];
};

export type InitialState = {
	type: RoomEventType.INITIAL_STATE;
	payload: RoomState;
};

export type RoomEvent = InitialState | NewStroke | StrokePoint;

export type NewStroke = {
	type: RoomEventType.NEW_STROKE;
	payload: Stroke;
};

export type StrokePoint = {
	type: RoomEventType.STROKE_POINT;
	payload: number[];
};