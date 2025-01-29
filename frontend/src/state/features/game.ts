import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Word } from "./room";

export enum GameRole {
	Drawing = "drawing",
	Guessing = "guessing",
}

export interface GameState {
	wordOptions: Word[];
	selectedWord: Word | null;
	pointsAwarded: Record<string, number>;
}

const initialState: GameState = {
	wordOptions: [],
	selectedWord: null,
	pointsAwarded: {},
};

export const gameSlice = createSlice({
	name: "game",
	initialState,
	reducers: {
		reset: () => initialState,
		setPointsAwarded: (
			state,
			action: PayloadAction<Record<string, number>>
		) => {
			state.pointsAwarded = action.payload;
		},
		setWordOptions: (state, action: PayloadAction<Word[]>) => {
			state.wordOptions = action.payload;
		},
		selectWord: (state, action: PayloadAction<Word>) => {
			state.selectedWord = action.payload;
		},
	},
});

export const { setPointsAwarded, setWordOptions, selectWord } =
	gameSlice.actions;

export default gameSlice.reducer;
