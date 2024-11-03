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
import { useWindowSize } from "@/hooks/use-window-size";

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
	padding,
	width,
	height,
	role,
}: {
	width: number;
	height: number;
	padding?: number;
	role: GameRole;
}) {
	const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
	const cursorRef = React.useRef<HTMLDivElement | null>(null);
	const strokeCountRef = React.useRef(0);

	const [windowWidth, windowHeight] = useWindowSize();

	const dispatch = useDispatch();

	const strokes = useSelector((state: RootState) => state.canvas.strokes);
	const hue = useSelector((state: RootState) => state.client.canvas.hue);
	const lightness = useSelector(
		(state: RootState) => state.client.canvas.lightness
	);

	const currentPhaseDeadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);

	const word = useSelector((state: RootState) => state.game.selectedWord);

	const strokeColor = React.useMemo(() => {
		const hslToHex = (h: number, s: number, l: number): string => {
			l /= 100;
			const a = (s * Math.min(l, 1 - l)) / 100;
			const f = (n: number) => {
				const k = (n + h / 30) % 12;
				const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
				return Math.round(255 * color)
					.toString(16)
					.padStart(2, "0");
			};
			return `#${f(0)}${f(8)}${f(4)}`;
		};
		return hslToHex(hue, 100, lightness);
	}, [hue, lightness]);

	const strokeWidth = useSelector(
		(state: RootState) => state.client.canvas.strokeWidth
	);

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

	const roundIsActive = React.useMemo(() => {
		return new Date(currentPhaseDeadline).getTime() + 1000 >= Date.now();
	}, [currentPhaseDeadline, word]);

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

	// Add scale factor state
	const [scaleFactor, setScaleFactor] = React.useState(1);

	// Calculate scale factor when window or desired dimensions change
	React.useEffect(() => {
		const widthScale = windowWidth / width;
		const heightScale = windowHeight / height;
		const newScale = Math.min(widthScale, heightScale, 1); // Never scale up, only down
		setScaleFactor(newScale);
	}, [windowWidth, windowHeight, width, height]);

	// Update stroke coordinate calculations
	const getScaledCoordinates = React.useCallback(
		(clientX: number, clientY: number, rect: DOMRect) => {
			const x = ((clientX - rect.left) / scaleFactor) * CANVAS_SCALE;
			const y = ((clientY - rect.top) / scaleFactor) * CANVAS_SCALE;
			return [x, y];
		},
		[scaleFactor]
	);

	// Update handlers to use scaled coordinates
	const handleNewStroke = React.useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			if (!roundIsActive) return;
			const rect = e.currentTarget.getBoundingClientRect();
			const [x, y] = getScaledCoordinates(e.clientX, e.clientY, rect);
			dispatch(
				addStroke({
					color: strokeColor,
					width: strokeWidth,
					points: [[x, y]],
				})
			);
		},
		[strokeColor, strokeWidth, getScaledCoordinates, roundIsActive]
	);

	const handleStrokePoint = React.useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			if (e.buttons !== 1 || !roundIsActive) return;
			const rect = e.currentTarget.getBoundingClientRect();
			const [x, y] = getScaledCoordinates(e.clientX, e.clientY, rect);
			dispatch(addStrokePoint([x, y]));
		},
		[dispatch, getScaledCoordinates, roundIsActive]
	);

	React.useEffect(() => {
		const canvas = canvasRef.current;
		const cursor = cursorRef.current;
		if (!canvas || !cursor) return;

		const updateCursorPosition = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			cursor.style.left = `${e.clientX - rect.left}px`;
			cursor.style.top = `${e.clientY - rect.top}px`;
		};

		canvas.addEventListener("mousemove", updateCursorPosition);
		canvas.addEventListener("mouseenter", () => {
			if (role === GameRole.Drawing) {
				cursor.style.display = "block";
			}
		});
		canvas.addEventListener("mouseleave", () => {
			cursor.style.display = "none";
		});

		return () => {
			canvas.removeEventListener("mousemove", updateCursorPosition);
			canvas.removeEventListener("mouseenter", () => {});
			canvas.removeEventListener("mouseleave", () => {});
		};
	}, [role]);

	React.useEffect(() => {
		const cursor = cursorRef.current;
		if (!cursor) return;

		const size = strokeWidth * 0.5; // Adjust this multiplier as needed
		cursor.style.width = `${size}px`;
		cursor.style.height = `${size}px`;
		cursor.style.backgroundColor = `${strokeColor}33`; // 33 is 20% opacity in hex
		cursor.style.border = `1px solid white`;
		cursor.style.boxShadow = `0 0 0 1px grey`;
	}, [strokeColor, strokeWidth]);

	// Update touch handlers
	const handleTouchStart = React.useCallback(
		(e: React.TouchEvent<HTMLCanvasElement>) => {
			if (role === GameRole.Drawing && roundIsActive) {
				e.preventDefault();
				const rect = e.currentTarget.getBoundingClientRect();
				const touch = e.touches[0];
				const [x, y] = getScaledCoordinates(touch.clientX, touch.clientY, rect);
				dispatch(
					addStroke({
						color: strokeColor,
						width: strokeWidth,
						points: [[x, y]],
					})
				);
			}
		},
		[strokeColor, strokeWidth, role, getScaledCoordinates, roundIsActive]
	);

	const handleTouchMove = React.useCallback(
		(e: React.TouchEvent<HTMLCanvasElement>) => {
			if (role === GameRole.Drawing && roundIsActive) {
				e.preventDefault();
				const rect = e.currentTarget.getBoundingClientRect();
				const touch = e.touches[0];
				const [x, y] = getScaledCoordinates(touch.clientX, touch.clientY, rect);
				dispatch(addStrokePoint([x, y]));
			}
		},
		[dispatch, role, getScaledCoordinates, roundIsActive]
	);

	return (
		<ContextMenu>
			<ContextMenuTrigger
				style={{
					width: width * scaleFactor - (padding ?? 0),
					height: height * scaleFactor - (padding ?? 0),
				}}
				className="relative"
			>
				<canvas
					className={`border-[3px] border-border rounded-lg bg-background w-full h-full relative z-10 ${
						role === GameRole.Drawing ? "cursor-none" : ""
					}`}
					width={width * CANVAS_SCALE - (padding ?? 0)}
					height={height * CANVAS_SCALE - (padding ?? 0)}
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
					onTouchStart={handleTouchStart}
					onTouchMove={handleTouchMove}
					ref={canvasRef}
				/>
				<div className=" w-[98%] h-full bg-border absolute left-1/2 rounded-xl -translate-x-1/2 -bottom-1.5" />
				{role === GameRole.Drawing && (
					<div
						ref={cursorRef}
						className="absolute rounded-full pointer-events-none z-50"
						style={{
							display: "none",
							transform: "translate(-50%, -50%)",
						}}
					/>
				)}
			</ContextMenuTrigger>
			<ContextMenuContent className="overflow-visible p-0 bg-transparent rounded-[2px] border-[6px] border-white shadow-lg">
				<HexColorPicker
					className="custom-pointers"
					color={strokeColor}
					// onChange={(color) => dispatch(change)}
				/>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export default Canvas;
