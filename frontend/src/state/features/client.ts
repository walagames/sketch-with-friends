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
		hue: number;
		lightness: number;
		strokeWidth: number;
		tool: string;
	};
	enteredRoomCode: string;
	isJoining: boolean;
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
		hue: 0,
		lightness: 50,
		strokeWidth: 25,
		tool: CanvasTool.Brush,
	},
	enteredRoomCode: "",
	isJoining: false,
};

export const clientSlice = createSlice({
	name: "client",
	initialState,
	reducers: {
		// Only comes from the server
		reset: () => initialState,
		initializeClient: (state, action: PayloadAction<string>) => {
			state.isJoining = false;
			state.id = action.payload;
		},
		setIsJoining: (state, action: PayloadAction<boolean>) => {
			state.isJoining = action.payload;
		},
		changeHue: (state, action: PayloadAction<number>) => {
			state.canvas.hue = action.payload;
			state.canvas.lightness = 50;
		},
		changeLightness: (state, action: PayloadAction<number>) => {
			state.canvas.lightness = action.payload;
		},
		changeStrokeWidth: (state, action: PayloadAction<number>) => {
			state.canvas.strokeWidth = action.payload;
		},
		changeTool: (state, action: PayloadAction<CanvasTool>) => {
			state.canvas.tool = action.payload;
		},
		enterRoomCode: (state, action: PayloadAction<string>) => {
			state.enteredRoomCode = action.payload;
		},
	},
});

export const {
	changeHue,
	changeLightness,
	changeStrokeWidth,
	changeTool,
	enterRoomCode,
	setIsJoining,
} = clientSlice.actions;

export default clientSlice.reducer;
