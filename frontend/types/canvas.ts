export type Stroke = {
	points: number[][];
	color: string;
	width: number;
};

export enum Tool {
	BRUSH = "BRUSH",
	BUCKET = "BUCKET",
}

export enum SettingActionType {
	CHANGE_COLOR = "CHANGE_COLOR",
	CHANGE_STROKE_WIDTH = "CHANGE_STROKE_WIDTH",
	CHANGE_TOOL = "CHANGE_TOOL",
}

export type CanvasToolSettings = {
	color: string;
	strokeWidth: number;
	tool: Tool;
};

export type ChangeColor = {
	type: SettingActionType.CHANGE_COLOR;
	payload: string;
};

export type ChangeStrokeWidth = {
	type: SettingActionType.CHANGE_STROKE_WIDTH;
	payload: number;
};

export type ChangeTool = {
	type: SettingActionType.CHANGE_TOOL;
	payload: Tool;
};

export type CanvasAction = ChangeColor | ChangeStrokeWidth | ChangeTool;



