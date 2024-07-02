export enum RoomEvent {
	NEW_ROUND = "NEW_ROUND",
	ROOM_STATE = "ROOM_STATE",
	MESSAGE = "MESSAGE",
	GAME_END = "GAME_END",
	GAME_START = "GAME_START",
	STROKE = "STROKE",
	STROKE_START = "STROKE_START",
}

export enum PlayerAction {
	SUBMIT_ANSWER = "SUBMIT_ANSWER",
	START_GAME = "START_GAME",
	CLOSE_ROOM = "CLOSE_ROOM",
	STROKE = "STROKE",
	START_STROKE = "START_STROKE",
}

export enum PlayerRole {
	HOST = "HOST",
	PLAYER = "PLAYER",
}

export enum PlayerStatus {
	JOINING = "JOINING",
	CONNECTED = "CONNECTED",
	DISCONNECTED = "DISCONNECTED",
}

export type Player = {
	id: string;
	name: string;
	role: PlayerRole;
	status: PlayerStatus;
};

export type RoomState = {
	code: string;
	role: string;
	socketUrl: string;
	players: Player[];
	points: number[][];
};
