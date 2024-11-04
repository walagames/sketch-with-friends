import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CanvasState {
	strokes: Stroke[];
}

export type Stroke = {
	points: number[][];
	color: string;
	width: number;
};

const initialState: CanvasState = {
	strokes: [],
};

export const canvasSlice = createSlice({
	name: "canvas",
	initialState,
	reducers: {
		setStrokes: (state, action: PayloadAction<Stroke[]>) => {
			state.strokes = action.payload;
		},
		addStroke: (state, action: PayloadAction<Stroke>) => {
			state.strokes.push(action.payload);
		},
		addStrokePoint: (state, action: PayloadAction<number[]>) => {
			if (state.strokes.length === 0) {
				return;
			}
			state.strokes[state.strokes.length - 1].points.push(action.payload);
		},
		clearStrokes: (state) => {
			state.strokes = [];
		},
		undoStroke: (state) => {
			state.strokes.pop();
		},
		addBucketFill: (state, action: PayloadAction<{ x: number; y: number }>) => {
			// TODO: Implement bucket fill
		},
	},
});

export const {
	addStroke,
	addStrokePoint,
	addBucketFill,
	clearStrokes,
	undoStroke,
} = canvasSlice.actions;

export default canvasSlice.reducer;
