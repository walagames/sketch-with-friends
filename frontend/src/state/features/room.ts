import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GameRole } from "./game";
import { AvatarConfig } from "@/lib/avatar";

export enum RoomStage {
	PreGame = "preGame",
	Playing = "playing",
	Unanimous = "unanimous",
}

export type Player = {
	id: string;
	profile: PlayerProfile;
	roomRole: RoomRole;
	gameRole: GameRole;
	score: number;
	streak: number;
};

export type PlayerProfile = {
	username: string;
	avatarConfig: AvatarConfig;
};

export enum RoomRole {
	Host = "host",
	Player = "player",
}

export enum PlayerConnectionStatus {
	Joining = "joining",
	Connected = "connected",
}

export enum WordDifficulty {
	Easy = "easy",
	Medium = "medium",
	Hard = "hard",
	All = "all",
}

export enum WordBank {
	Default = "default",
	Custom = "custom",
	Mixed = "mixed",
}

export enum GameMode {
	Classic = "classic",
	NoHints = "noHints",
}

type RoomSettings = {
	playerLimit: number;
	drawingTimeAllowed: number;
	totalRounds: number;
	wordDifficulty: WordDifficulty;
	wordBank: WordBank;
	customWords: string[];
	gameMode: GameMode;
};

export interface RoomState {
	id: string;
	settings: RoomSettings;
	players: { [key: string]: Player };
	stage: RoomStage;
}

const initialState: RoomState = {
	id: "",
	settings: {
		playerLimit: 6,
		drawingTimeAllowed: 90,
		totalRounds: 4,
		wordDifficulty: WordDifficulty.All,
		wordBank: WordBank.Mixed,
		customWords: [],
		gameMode: GameMode.Classic,
	},
	players: {},
	stage: RoomStage.Unanimous,
};

export const roomSlice = createSlice({
	name: "room",
	initialState,
	reducers: {
		reset: () => initialState,
		changeStage: (state, action: PayloadAction<RoomStage>) => {
			state.stage = action.payload;
		},
		initializeRoom: (
			state,
			action: PayloadAction<{
				id: string;
				settings: RoomSettings;
				players: { [key: string]: Player };
				stage: RoomStage;
			}>
		) => {
			// Update the URL with the room ID as a query parameter
			const url = new URL(window.location.href);
			url.searchParams.set("room", action.payload.id);
			window.history.replaceState({}, "", url.toString());
			state.id = action.payload.id;
			state.settings = action.payload.settings;
			state.players = action.payload.players;
			state.stage = action.payload.stage;
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
			action: PayloadAction<PlayerProfile & { id: string }>
		) => {
			state.players[action.payload.id].profile = {
				username: action.payload.username,
				avatarConfig: action.payload.avatarConfig,
			};
		},
	},
});

export const {
	changeStage,
	setPlayers,
	playerLeft,
	changeRoomSettings,
	changePlayerProfile,
} = roomSlice.actions;

export default roomSlice.reducer;
