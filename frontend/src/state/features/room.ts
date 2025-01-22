import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AvatarConfig } from "@/lib/avatar";

export type ChatMessage = {
	id: string;
	playerId: string;
	guess: boolean;
	isCorrect: boolean;
	pointsAwarded: number;
	isClose: boolean;
	isSystemMessage: boolean;
};

export enum RoomRole {
	Host = "host",
	Player = "player",
}

export enum GameRole {
	Drawing = "drawing",
	Guessing = "guessing",
}

export type Player = {
	id: string;
	username: string;
	avatarConfig: AvatarConfig;
	roomRole: RoomRole;
	gameRole: GameRole;
	score: number;
	streak: number;
};

export enum WordBank {
	Default = "default",
	Custom = "custom",
	Mixed = "mixed",
}

export enum GameMode {
	Classic = "classic",
	NoHints = "noHints",
}

export enum WordDifficulty {
	Easy = "easy",
	Medium = "medium",
	Hard = "hard",
	All = "all",
	Custom = "custom",
}

export type Word = {
	category: string;
	value: string;
	difficulty: WordDifficulty;
};

type RoomSettings = {
	playerLimit: number;
	drawingTimeAllowed: number;
	totalRounds: number;
	wordDifficulty: WordDifficulty;
	wordBank: WordBank;
	customWords: Word[];
	gameMode: GameMode;
};

export enum RoomState {
	Unanimous = 0,
	EnterCode = 1,
	EnterPlayerInfo = 2,

	Waiting = 100,
	Picking = 200,
	Drawing = 201,
	PostDrawing = 202,
	GameOver = 203,
}

export interface Room {
	id: string;
	settings: RoomSettings;
	players: { [key: string]: Player };
	currentRound: number;
	chatMessages: ChatMessage[];

	currentState: RoomState;
	previousState: RoomState;
	timerEndsAt: string; // utc date string

	playerId: string;
}

const initialState: Room = {
	id: "",
	playerId: "",
	settings: {
		playerLimit: 6,
		drawingTimeAllowed: 90,
		totalRounds: 3,
		wordDifficulty: WordDifficulty.All,
		wordBank: WordBank.Mixed,
		customWords: [],
		gameMode: GameMode.Classic,
	},
	players: {},
	timerEndsAt: "",
	currentState: RoomState.EnterCode,
	previousState: RoomState.Unanimous,
	currentRound: 0,
	chatMessages: [],
};

export const roomSlice = createSlice({
	name: "room",
	initialState,
	reducers: {
		reset: () => initialState,

		init: (
			state,
			action: PayloadAction<{
				id: string;
				settings: RoomSettings;
				players: { [key: string]: Player };
				currentRound: number;
				chatMessages: ChatMessage[];
			}>
		) => {
			// Update the URL with the room ID as a query parameter
			const url = new URL(window.location.href);
			url.searchParams.set("room", action.payload.id);
			window.history.replaceState({}, "", url.toString());
			state.id = action.payload.id;
			state.settings = action.payload.settings;
			state.players = action.payload.players;
			state.currentRound = action.payload.currentRound;
			state.chatMessages = action.payload.chatMessages;
		},
		setPlayerId: (state, action: PayloadAction<string>) => {
			state.playerId = action.payload;
		},
		setPlayers: (state, action: PayloadAction<{ [key: string]: Player }>) => {
			state.players = action.payload;
		},
		playerJoined: (state, action: PayloadAction<Player>) => {
			state.players[action.payload.id] = action.payload;
		},
		playerLeft: (state, action: PayloadAction<string>) => {
			delete state.players[action.payload];
		},
		changeRoomSettings: (state, action: PayloadAction<RoomSettings>) => {
			state.settings = action.payload;
		},
		changePlayerProfile: (
			state,
			action: PayloadAction<{
				id: string;
				avatarConfig: AvatarConfig;
				username: string;
			}>
		) => {
			state.players[action.payload.id].avatarConfig =
				action.payload.avatarConfig;
			state.players[action.payload.id].username = action.payload.username;
		},
		setChat: (state, action: PayloadAction<ChatMessage[]>) => {
			state.chatMessages = action.payload;
		},
		newChatMessage: (state, action: PayloadAction<ChatMessage>) => {
			state.chatMessages.push(action.payload);
		},
		setCurrentRound: (state, action: PayloadAction<number>) => {
			state.currentRound = action.payload;
		},
		setCurrentState: (state, action: PayloadAction<RoomState>) => {
			state.previousState = state.currentState;
			state.currentState = action.payload;
		},
		setTimer: (state, action: PayloadAction<string>) => {
			state.timerEndsAt = action.payload;
		},
	},
});

export const {
	setPlayers,
	playerLeft,
	changeRoomSettings,
	changePlayerProfile,
	setCurrentState,
} = roomSlice.actions;

export default roomSlice.reducer;
