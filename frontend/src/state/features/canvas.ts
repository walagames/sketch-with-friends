import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { generateUniqueId } from "@/lib/id";

export interface CanvasState {
	elements: CanvasElement[];
}

export interface CanvasElement {
	id: string;
	type: ElementType
}

export interface StrokeElement extends CanvasElement {
	type: 'stroke';
	points: number[][];
	color: string;
	width: number;
	isPartial: boolean;
};

export interface FillElement extends CanvasElement {
	type: 'fill';
	point: [number, number];
	color: string;
};

export interface StrokeUpdate {
    id: string;
    points: number[][];
    isPartial: boolean;
}

export type ElementType = 'stroke' | 'fill';

const initialState: CanvasState = {
	elements: [],
};

export const addStroke = (
    color: string,
    width: number,
    points: number[][]
): StrokeElement => ({
    id: generateUniqueId(),
    type: 'stroke',
    color,
    width,
    points,
	isPartial: true,
});

export const addFill = (
    point: [number, number],
    color: string
): FillElement => ({
    id: generateUniqueId(),
    type: 'fill',
    point,
    color,
});

export const canvasSlice = createSlice({
	name: "canvas",
	initialState,
	reducers: {
		setElements: (state, action: PayloadAction<CanvasElement[]>) => {
			state.elements = action.payload;
		},
		addElement: (state, action: PayloadAction<CanvasElement>) => {
			state.elements.push(action.payload);
		},
		updateElement: (state, action: PayloadAction<CanvasElement>) => {
            const index = state.elements.findIndex(el => el.id === action.payload.id);
            if (index !== -1) {
                state.elements[index] = action.payload;
			}
		},
		undoElement: (state) => {
			state.elements.pop();
		},
		clearElements: (state) => {
			state.elements = [];
		},
		updateStrokePoints: (state, action: PayloadAction<StrokeUpdate>) => {
			const { id, points, isPartial } = action.payload;
			const index = state.elements.findIndex(el => el.id === id);
			if (index !== -1 && state.elements[index].type === 'stroke') {
				const stroke = state.elements[index] as StrokeElement;
				if (points.length > 0) {
					const cleanedPoints = points.filter((point) => {
						const lastPoint = stroke.points[stroke.points.length - 1];
						return !lastPoint || lastPoint[0] !== point[0] || lastPoint[1] !== point[1];
					});
					stroke.points = isPartial
						? [...stroke.points, ...cleanedPoints]
						: cleanedPoints;
				}

				if (!isPartial) { // stroke is complete
					stroke.isPartial = false;
				}
			}
		},
	},
});

export const {
	setElements,
	addElement,
	updateElement,
	undoElement,
	clearElements,
	updateStrokePoints,
} = canvasSlice.actions;

export default canvasSlice.reducer;
