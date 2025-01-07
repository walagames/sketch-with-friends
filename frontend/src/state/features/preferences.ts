import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AvatarConfig = {
	hairStyle:
		| "plain"
		| "wavy"
		| "shortCurls"
		| "parting"
		| "spiky"
		| "roundBob"
		| "longCurls"
		| "buns"
		| "bangs"
		| "fluffy"
		| "flatTop"
		| "shaggy";
	hairColor: "000000" | "1d5dff" | "ff543d" | "fff500" | "ffffff";
	mood:
		| "happy"
		| "sad"
		| "angry"
		| "neutral"
		| "superHappy"
		| "hopeful"
		| "confused";
	skinColor: "8d5524" | "c26450" | "e6b087" | "ffd6c0" | "ffe4d3";
	backgroundColor:
		| "e02929"
		| "e08529"
		| "e0da29"
		| "5de029"
		| "29e0d4"
		| "9129e0"
		| "e029ce";
};

export interface PreferencesState {
	volume: number;
	username: string;
	avatarConfig: AvatarConfig;
	customWords: string[];
}

const initialState: PreferencesState = {
	volume: 0.5,
	username: "",
	avatarConfig: {
		hairStyle: "bangs",
		hairColor: "000000",
		mood: "happy",
		skinColor: "8d5524",
		backgroundColor: "e02929",
	},
	customWords: [],
};

export const preferencesSlice = createSlice({
	name: "preferences",
	initialState,
	reducers: {
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
	},
});

export const {
	changeVolume,
	changeAvatarConfig,
	changeUsername,
	changeCustomWords,
} = preferencesSlice.actions;
export default preferencesSlice.reducer;
