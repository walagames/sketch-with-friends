import { z } from "zod";
export enum RoomEvent {
	UPDATE_SCORES = "UPDATE_SCORES",
	NEW_ROUND = "NEW_ROUND",
	ROOM_STATE = "ROOM_STATE",
	MESSAGE = "MESSAGE",
	GAME_OVER = "GAME_OVER",
	GAME_START = "GAME_START",
	STROKE = "STROKE",
}

export enum PlayerAction {
	SUBMIT_ANSWER = "SUBMIT_ANSWER",
	START_GAME = "START_GAME",
	CLOSE_ROOM = "CLOSE_ROOM",
	STROKE = "STROKE",
}

export enum PlayerRole {
	HOST = "HOST",
	PLAYER = "PLAYER",
}

export enum PlayerStatus {
	JOINING = "JOINING",
	CONNECTED = "CONNECTED",
	DISCONNECTED = "DISCONNECTED",
	KICKED = "KICKED",
}

export type PlayerProfile = {
	id: string;
	name: string;
};

export type Player = {
	profile: PlayerProfile;
	role: PlayerRole;
	status: PlayerStatus;
};

export type RoomState = {
	code: string;
	role: string;
	socketUrl: string;
	name: string;
	players: Player[];
	points: number[][];
};
