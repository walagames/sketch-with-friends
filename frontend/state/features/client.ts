import { Avatar, AvatarConfig } from "@/lib/avatar";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { hslToHex } from "@/lib/color";

export enum CanvasTool {
	Brush = "brush",
	Eraser = "eraser",
	Bucket = "bucket",
}

export interface ClientState {
	canvas: {
		hue: number;
		lightness: number;
		strokeWidth: number;
		tool: string;
		color: string;
		recentlyUsedColors: string[];
	};
	volume: number;
	username: string;
	avatarConfig: AvatarConfig;
	customWords: string[];
	roomCode: string;
}

const initialState: ClientState = {
	canvas: {
		hue: 0,
		lightness: 0,
		color: "#000000",
		strokeWidth: 25,
		tool: CanvasTool.Brush,
		recentlyUsedColors: [],
	},
	volume: 0.5,
	username: "",
	avatarConfig: Avatar.random(),
	customWords: [],
	roomCode: "",
};

export const clientSlice = createSlice({
	name: "client",
	initialState,
	reducers: {
		// Only comes from the server
		reset: () => initialState,
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
		changeVolume: (state, action: PayloadAction<number>) => {
			state.volume = action.payload;
		},
		changeAvatarConfig: (state, action: PayloadAction<AvatarConfig>) => {
			state.avatarConfig = action.payload;
		},
		changeUsername: (state, action: PayloadAction<string>) => {
			state.username = action.payload;
		},
		changeCustomWords: (state, action: PayloadAction<string[]>) => {
			state.customWords = action.payload;
		},
		enterRoomCode: (state, action: PayloadAction<string>) => {
			state.roomCode = action.payload;
		},
	},
});

export const {
	changeHue,
	changeLightness,
	changeStrokeWidth,
	changeTool,
	changeColor,
	addRecentlyUsedColor,
	changeVolume,
	changeAvatarConfig,
	changeUsername,
	changeCustomWords,
	enterRoomCode,
} = clientSlice.actions;

export default clientSlice.reducer;
