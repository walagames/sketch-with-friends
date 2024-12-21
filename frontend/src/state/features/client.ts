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
		color: string;
		recentlyUsedColors: string[];
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
		lightness: 0,
		color: "#000000",
		strokeWidth: 25,
		tool: CanvasTool.Brush,
		recentlyUsedColors: [],
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
		changeColor: (state, action: PayloadAction<string>) => {
			const hex = action.payload;
			state.canvas.color = hex;

			// Convert hex to RGB
			const r = parseInt(hex.slice(1, 3), 16) / 255;
			const g = parseInt(hex.slice(3, 5), 16) / 255;
			const b = parseInt(hex.slice(5, 7), 16) / 255;

			const max = Math.max(r, g, b);
			const min = Math.min(r, g, b);

			// Calculate lightness
			const lightness = ((max + min) / 2) * 100;

			// Calculate hue
			let hue = 0;
			if (max !== min) {
				const d = max - min;
				if (max === r) {
					hue = (g - b) / d + (g < b ? 6 : 0);
				} else if (max === g) {
					hue = (b - r) / d + 2;
				} else if (max === b) {
					hue = (r - g) / d + 4;
				}
				hue = Math.round(hue * 60);
			}

			state.canvas.hue = hue;
			state.canvas.lightness = Math.round(lightness);
		},
		addRecentlyUsedColor: (state, action: PayloadAction<string>) => {
			const color = action.payload;
			// Remove the color if it already exists
			state.canvas.recentlyUsedColors = state.canvas.recentlyUsedColors.filter(
				(c) => c !== color
			);
			// Add the color to the front
			state.canvas.recentlyUsedColors.unshift(color);
			// Keep only the last 6 colors
			state.canvas.recentlyUsedColors = state.canvas.recentlyUsedColors.slice(
				0,
				6
			);
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
	changeColor,
	addRecentlyUsedColor,
} = clientSlice.actions;

export default clientSlice.reducer;
