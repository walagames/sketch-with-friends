import * as React from "react";
import { getStroke } from "perfect-freehand";

import {
	ContextMenu,
	ContextMenuTrigger,
	ContextMenuContent,
} from "./ui/context-menu";
import { HexColorPicker } from "react-colorful";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { GameRole } from "@/state/features/game";
import { addStroke, addStrokePoint, Stroke } from "@/state/features/canvas";
import { changeStrokeColor } from "@/state/features/client";

// make canvas less pixelated
const CANVAS_SCALE = 2;

// perfect-freehand options
const strokeOptions = {
	size: 3,
	smoothing: 0.32,
	thinning: 0.32,
	streamline: 0.99,
	easing: (t: number) => t,
	start: {
		taper: 0,
		cap: true,
	},
	end: {
		taper: 0,
		cap: true,
	},
};
// Constructs svg path from stroke
function getSvgPathFromStroke(stroke: number[][]) {
	if (!stroke.length) return "";

	const d = stroke.reduce(
		(acc, [x0, y0], i, arr) => {
			const [x1, y1] = arr[(i + 1) % arr.length];
			acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
			return acc;
		},
		["M", ...stroke[0], "Q"]
	);

	d.push("Z");
	return d.join(" ");
}

function Canvas({
	width,
	height,
	role,
}: {
	width: number;
	height: number;
	role: GameRole;
}) {
	const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
	const strokeCountRef = React.useRef(0);

	const dispatch = useDispatch();

	const strokes = useSelector((state: RootState) => state.canvas.strokes);
	const strokeColor = useSelector(
		(state: RootState) => state.client.canvas.strokeColor
	);
	const strokeWidth = useSelector(
		(state: RootState) => state.client.canvas.strokeWidth
	);
	// const [windowWidth, windowHeight] = useWindowSize();

	const fillCanvasWithStroke = React.useCallback(
		(ctx: CanvasRenderingContext2D, stroke: Stroke) => {
			const myStroke = getStroke(stroke.points, {
				...strokeOptions,
				size: stroke.width,
			});
			const pathData = getSvgPathFromStroke(myStroke);
			const myPath = new Path2D(pathData);
			ctx.fillStyle = stroke.color;
			ctx.fill(myPath);
		},
		[]
	);

	const clearCanvas = React.useCallback(
		(ctx: CanvasRenderingContext2D) => {
			ctx.clearRect(0, 0, width * CANVAS_SCALE, height * CANVAS_SCALE);
		},
		[width, height]
	);

	const drawAllStrokes = React.useCallback(() => {
		const ctx = canvasRef.current?.getContext("2d");

		if (ctx) {
			clearCanvas(ctx);
			for (const stroke of strokes) {
				fillCanvasWithStroke(ctx, stroke);
			}
		}
	}, [fillCanvasWithStroke, strokes]);

	const drawMostRecentStroke = React.useCallback(() => {
		const canvasContext = canvasRef.current?.getContext("2d");
		const strokeCount = strokes.length;

		if (canvasContext && strokeCount) {
			const stroke = strokes[strokeCount - 1];
			fillCanvasWithStroke(canvasContext, stroke);
		}
	}, [fillCanvasWithStroke, strokes]);

	// Draws all strokes on first load and when window size changes
	React.useEffect(() => {
		const isWindowInitialized = width !== 0 && height !== 0;

		if (isWindowInitialized) {
			drawAllStrokes();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [width, height]);

	// Only draws most recent stroke unless canvas is cleared or a stroke is undone
	React.useEffect(() => {
		const isWindowInitialized = width !== 0 && height !== 0;
		const newStrokeCount = strokes.length;

		if (strokeCountRef.current > newStrokeCount || strokes.length === 0) {
			// Undo stroke or clear canvas
			drawAllStrokes();
		} else if (strokes.length > 0 && isWindowInitialized) {
			drawMostRecentStroke();
		}

		strokeCountRef.current = newStrokeCount;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [strokes]);

	const handleNewStroke = React.useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			const rect = e.currentTarget.getBoundingClientRect();
			const x = (e.clientX - rect.left) * CANVAS_SCALE;
			const y = (e.clientY - rect.top) * CANVAS_SCALE;
			dispatch(
				addStroke({
					color: strokeColor,
					width: strokeWidth,
					points: [[x, y]],
				})
			);
		},
		[strokeColor, strokeWidth]
	);

	const handleStrokePoint = React.useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			// Only draw when left click is held down
			if (e.buttons !== 1) return;

			const rect = e.currentTarget.getBoundingClientRect();
			const x = (e.clientX - rect.left) * CANVAS_SCALE;
			const y = (e.clientY - rect.top) * CANVAS_SCALE;
			dispatch(addStrokePoint([x, y]));
		},
		[dispatch]
	);

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<canvas
					className="border border-border rounded-lg bg-background"
					style={{
						width,
						height,
					}}
					width={width * CANVAS_SCALE}
					height={height * CANVAS_SCALE}
					onMouseDown={(e) => {
						if (e.button === 0 && role === GameRole.Drawing) {
							handleNewStroke(e);
						}
					}}
					onMouseMove={(e) => {
						if (e.buttons === 1 && role === GameRole.Drawing) {
							handleStrokePoint(e);
						}
					}}
					ref={canvasRef}
				/>
			</ContextMenuTrigger>
			<ContextMenuContent className="overflow-visible p-0 bg-transparent rounded-[2px] border-[6px] border-[#423e2e]/90">
				<HexColorPicker
					className="custom-pointers"
					color={strokeColor}
					onChange={(color) => dispatch(changeStrokeColor(color))}
				/>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export default Canvas;