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
			state.strokes[state.strokes.length - 1].points.push(action.payload);
		},
		clearStrokes: (state) => {
			state.strokes = [];
		},
		undoStroke: (state) => {
			state.strokes.pop();
		},
	},
});

export const { addStroke, addStrokePoint, clearStrokes, undoStroke } =
	canvasSlice.actions;

export default canvasSlice.reducer;
