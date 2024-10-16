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
	currentPhaseDeadline: string;
	currentRound: number;
	wordOptions: string[];
	guesses: Guess[];
	selectedWord: string;
	isLastPhase: boolean;
	isFirstPhase: boolean;
}

const initialState: GameState = {
	round: 0,
	phase: GamePhase.Picking,
	currentPhaseDeadline: new Date().toISOString(),
	currentRound: 0,
	wordOptions: [],
	guesses: [],
	selectedWord: "",
	isLastPhase: false,
	isFirstPhase: false,
};

export type Guess = {
	playerId: string;
	guess: boolean;
	isCorrect: boolean;
	pointsAwarded: number;
	isClose: boolean;
};

export const gameSlice = createSlice({
	name: "game",
	initialState,
	reducers: {
		reset: () => initialState,
		changeRound: (state, action: PayloadAction<number>) => {
			state.round = action.payload;
		},
		changePhase: (
			state,
			action: PayloadAction<{
				phase: GamePhase;
				deadline: string;
				isLastPhase: boolean;
				isFirstPhase: boolean;
			}>
		) => {
			state.phase = action.payload.phase;
			state.currentPhaseDeadline = action.payload.deadline;
			state.isLastPhase = action.payload.isLastPhase;
			state.isFirstPhase = action.payload.isFirstPhase;
		},
		wordOptions: (state, action: PayloadAction<string[]>) => {
			state.wordOptions = action.payload;
		},
		selectWord: (state, action: PayloadAction<string>) => {
			state.selectedWord = action.payload;
		},
		setRound: (state, action: PayloadAction<number>) => {
			state.currentRound = action.payload;
		},
		guessResult: (state, action: PayloadAction<Guess>) => {
			state.guesses.push(action.payload);
		},
		setGuesses: (state, action: PayloadAction<Guess[]>) => {
			state.guesses = action.payload;
		},
		setPhaseDeadline: (state, action: PayloadAction<string>) => {
			state.currentPhaseDeadline = action.payload;
		},
	},
});

export const { changeRound, changePhase, selectWord } =
	gameSlice.actions;

export default gameSlice.reducer;
