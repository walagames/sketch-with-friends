import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GameRole } from "./game";
import { toast } from "sonner";

export enum RoomStage {
	PreGame = "preGame",
	Playing = "playing",
	Unanimous = "unanimous",
}

export type Player = {
	id: string;
	name: string;
	roomRole: RoomRole;
	gameRole: GameRole;
	avatarSeed: string;
	avatarColor: string;
	score: number;
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
	Random = "random",
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
		drawingTimeAllowed: 60,
		totalRounds: 4,
		wordDifficulty: WordDifficulty.Easy,
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
			toast.info(`${state.players[action.payload].name} has left the room`);
			delete state.players[action.payload];
		},
		changeRoomSettings: (state, action: PayloadAction<RoomSettings>) => {
			state.settings = action.payload;
		},
	},
});

export const { changeStage, setPlayers, playerLeft, changeRoomSettings } =
	roomSlice.actions;

export default roomSlice.reducer;
