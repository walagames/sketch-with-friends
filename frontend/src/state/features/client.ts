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

function hslToHex(h: number, l: number): string {
	const s = 100; // Saturation is always 100%

	const c = ((1 - Math.abs((2 * l) / 100 - 1)) * s) / 100;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l / 100 - c / 2;

	let r, g, b;
	if (h >= 0 && h < 60) {
		[r, g, b] = [c, x, 0];
	} else if (h >= 60 && h < 120) {
		[r, g, b] = [x, c, 0];
	} else if (h >= 120 && h < 180) {
		[r, g, b] = [0, c, x];
	} else if (h >= 180 && h < 240) {
		[r, g, b] = [0, x, c];
	} else if (h >= 240 && h < 300) {
		[r, g, b] = [x, 0, c];
	} else {
		[r, g, b] = [c, 0, x];
	}

	const rgb = [r, g, b].map((v) => Math.round((v + m) * 255));
	return `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

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
			state.canvas.color = hslToHex(action.payload, state.canvas.lightness);
		},
		changeLightness: (state, action: PayloadAction<number>) => {
			state.canvas.lightness = action.payload;
			state.canvas.color = hslToHex(state.canvas.hue, action.payload);
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
