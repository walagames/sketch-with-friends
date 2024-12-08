import { createSlice } from "@reduxjs/toolkit";

import { PayloadAction } from "@reduxjs/toolkit";

export interface PreferencesState {
	volume: number;
}

const initialState: PreferencesState = {
	volume: 0.5,
};

export const preferencesSlice = createSlice({
	name: "preferences",
	initialState,
	reducers: {
		changeVolume: (state, action: PayloadAction<number>) => {
			state.volume = action.payload;
		},
	},
});

export const { changeVolume } = preferencesSlice.actions;
export default preferencesSlice.reducer;
