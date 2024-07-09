export type Stroke = {
	points: number[][];
	color: string;
	width: number;
};

export enum Tool {
	BRUSH = "BRUSH",
	BUCKET = "BUCKET",
}

export type CanvasToolSettings = {
	color: string;
	strokeWidth: number;
	tool: Tool;
};

export type ChangeColor = {
	type: "CHANGE_COLOR";
	payload: string;
};

export type ChangeStrokeWidth = {
	type: "CHANGE_STROKE_WIDTH";
	payload: number;
};

export type ChangeTool = {
	type: "CHANGE_TOOL";
	payload: Tool;
};

export type CanvasAction = ChangeColor | ChangeStrokeWidth | ChangeTool;



