import {
	HairColor,
	HairStyle,
	Mood,
	SkinColor,
} from "@/components/views/join-room/player-info-form";
import { createSlice } from "@reduxjs/toolkit";

import { PayloadAction } from "@reduxjs/toolkit";

export type AvatarConfig = {
	hairStyle: HairStyle;
	hairColor: HairColor;
	mood: Mood;
	skinColor: SkinColor;
	backgroundColor: string;
};

export interface PreferencesState {
	volume: number;
	username: string;
	avatarConfig: AvatarConfig;
}

const initialState: PreferencesState = {
	volume: 0.5,
	username: "",
	avatarConfig: {
		hairStyle: "bangs",
		hairColor: "black",
		mood: "happy",
		skinColor: "white",
		backgroundColor: "e02929",
	},
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
	},
});

export const { changeVolume, changeAvatarConfig, changeUsername } =
	preferencesSlice.actions;
export default preferencesSlice.reducer;
