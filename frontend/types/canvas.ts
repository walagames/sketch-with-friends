export type Stroke = {
	points: number[][];
	color: string;
	width: number;
};

export enum Tool {
	BRUSH = "brush",
	BUCKET = "eraser",
}
