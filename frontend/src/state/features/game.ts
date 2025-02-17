import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WordDifficulty } from "./room";

export enum GamePhase {
	Picking = "picking",
	Drawing = "drawing",
	PostDrawing = "postDrawing",
	Unanimous = "unanimous",
}

export enum GameRole {
	Drawing = "drawing",
	Guessing = "guessing",
}

export type DrawingWord = {
	value: string;
	difficulty: WordDifficulty;
};

export interface GameState {
	round: number;
	phase: GamePhase;
	currentPhaseDeadline: string;
	currentRound: number;
	wordOptions: DrawingWord[];
	chatMessages: ChatMessage[];
	selectedWord: string;
	isLastPhase: boolean;
	isFirstPhase: boolean;
	pointsAwarded: Record<string, number>;
}

const initialState: GameState = {
	round: 0,
	phase: GamePhase.Unanimous,
	currentPhaseDeadline: new Date().toISOString(),
	currentRound: 0,
	wordOptions: [],
	chatMessages: [],
	selectedWord: "",
	isLastPhase: false,
	isFirstPhase: false,
	pointsAwarded: {},
};

export type ChatMessage = {
	id: string;
	playerId: string;
	guess: boolean;
	isCorrect: boolean;
	pointsAwarded: number;
	isClose: boolean;
	isSystemMessage: boolean;
};

export const gameSlice = createSlice({
	name: "game",
	initialState,
	reducers: {
		reset: () => initialState,
		changeRound: (state, action: PayloadAction<number>) => {
			state.round = action.payload;
		},
		pointsAwarded: (state, action: PayloadAction<Record<string, number>>) => {
			state.pointsAwarded = action.payload;
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
		wordOptions: (state, action: PayloadAction<DrawingWord[]>) => {
			state.wordOptions = action.payload;
		},
		selectWord: (state, action: PayloadAction<string>) => {
			state.selectedWord = action.payload;
		},
		setRound: (state, action: PayloadAction<number>) => {
			state.currentRound = action.payload;
		},
		newChatMessage: (state, action: PayloadAction<ChatMessage>) => {
			state.chatMessages.push(action.payload);
		},
		setChat: (state, action: PayloadAction<ChatMessage[]>) => {
			state.chatMessages = action.payload;
		},
		setPhaseDeadline: (state, action: PayloadAction<string>) => {
			state.currentPhaseDeadline = action.payload;
		},
	},
});

export const { changeRound, changePhase, selectWord } = gameSlice.actions;

export default gameSlice.reducer;
