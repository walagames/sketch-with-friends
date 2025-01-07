import { Avatar, AvatarConfig } from "@/lib/avatar";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PreferencesState {
	volume: number;
	username: string;
	avatarConfig: AvatarConfig;
	customWords: string[];
}

const initialState: PreferencesState = {
	volume: 0.5,
	username: "",
	avatarConfig: Avatar.random(),
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
