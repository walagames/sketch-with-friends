import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum GamePhase {
	Picking = "picking",
	Drawing = "drawing",
	PostDrawing = "postDrawing",
}

export enum GameRole {
	Drawing = "drawing",
	Guessing = "guessing",
}

export interface GameState {
	round: number;
	phase: GamePhase;
	currentPhaseDeadline: number;
	currentDrawer: string;
	wordOptions: string[];
	selectedWord: string;
	isCountdownActive: boolean;
}

const initialState: GameState = {
	round: 0,
	phase: GamePhase.Picking,
	currentPhaseDeadline: 0,
	currentDrawer: "",
	wordOptions: [],
	selectedWord: "",
	isCountdownActive: false,
};

export const gameSlice = createSlice({
	name: "game",
	initialState,
	reducers: {
		changeRound: (state, action: PayloadAction<number>) => {
			state.round = action.payload;
		},
		changePhase: (
			state,
			action: PayloadAction<{ phase: GamePhase; deadline: string }>
		) => {
			state.phase = action.payload.phase;
			state.currentPhaseDeadline = new Date(action.payload.deadline).getTime();
		},
		wordOptions: (state, action: PayloadAction<string[]>) => {
			state.wordOptions = action.payload;
		},
		selectWord: (state, action: PayloadAction<string>) => {
			state.selectedWord = action.payload;
		},
		toggleCountdown: (state, action: PayloadAction<boolean>) => {
			state.isCountdownActive = action.payload;
		},
	},
});

export const { changeRound, changePhase, selectWord } = gameSlice.actions;

export default gameSlice.reducer;
