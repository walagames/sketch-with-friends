import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum CanvasTool {
	Brush = "brush",
	Eraser = "eraser",
	Bucket = "bucket",
}

export interface ClientState {
	id: string;
	preferences: {
		soundsEnabled: boolean;
	};
	game: {
		wordOptions: string[];
		selectedWord: string;
		guessResponse: boolean | null;
	};
	canvas: {
		strokeColor: string;
		strokeWidth: number;
		tool: string;
	};
}

const initialState: ClientState = {
	id: "",
	preferences: {
		soundsEnabled: true,
	},
	game: {
		wordOptions: [],
		selectedWord: "",
		guessResponse: null,
	},
	canvas: {
		strokeColor: "#000000",
		strokeWidth: 2,
		tool: "pen",
	},
};

export const clientSlice = createSlice({
	name: "client",
	initialState,
	reducers: {
		// Only comes from the server
		initializeClient: (state, action: PayloadAction<string>) => {
			state.id = action.payload;
		},
		changeStrokeColor: (state, action: PayloadAction<string>) => {
			state.canvas.strokeColor = action.payload;
		},
		changeStrokeWidth: (state, action: PayloadAction<number>) => {
			state.canvas.strokeWidth = action.payload;
		},
		changeTool: (state, action: PayloadAction<CanvasTool>) => {
			state.canvas.tool = action.payload;
		},
		// setWordOptions: (state, action: PayloadAction<string[]>) => {
		// 	state.game.wordOptions = action.payload;
		// },
		// selectWord: (state, action: PayloadAction<string>) => {
		// 	state.game.selectedWord = action.payload;
		// },
	},
});

export const { changeStrokeColor, changeStrokeWidth, changeTool } =
	clientSlice.actions;

export default clientSlice.reducer;
