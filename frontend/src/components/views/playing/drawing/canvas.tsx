import * as React from "react";
// import { getStroke } from "perfect-freehand";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { GameRole } from "@/state/features/game";
import { addStroke, addStrokePoint, Stroke } from "@/state/features/canvas";
import { useWindowSize } from "@/hooks/use-window-size";
import { getGameRole } from "@/lib/player";
import { addRecentlyUsedColor } from "@/state/features/client";

// make canvas less pixelated
const CANVAS_SCALE = 2;

// // perfect-freehand options
// const strokeOptions = {
// 	size: 3,
// 	smoothing: 0.32,
// 	thinning: 0.32,
// 	streamline: 0.99,
// 	easing: (t: number) => t,
// 	start: {
// 		taper: 0,
// 		cap: true,
// 	},
// 	end: {
// 		taper: 0,
// 		cap: true,
// 	},
// };
// Constructs svg path from stroke
// function getSvgPathFromStroke(stroke: number[][]) {
// 	if (!stroke.length) return "";

// 	const d = stroke.reduce(
// 		(acc, [x0, y0], i, arr) => {
// 			const [x1, y1] = arr[(i + 1) % arr.length];
// 			acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
// 			return acc;
// 		},
// 		["M", ...stroke[0], "Q"]
// 	);

// 	d.push("Z");
// 	return d.join(" ");
// }

function Canvas({
	padding,
	width,
	height,
}: {
	width: number;
	height: number;
	padding?: number;
}) {
	const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
	const cursorRef = React.useRef<HTMLDivElement | null>(null);
	const strokeCountRef = React.useRef(0);

	const [windowWidth, windowHeight] = useWindowSize();

	const dispatch = useDispatch();

	const strokes = useSelector((state: RootState) => state.canvas.strokes);
	const strokeColor = useSelector(
		(state: RootState) => state.client.canvas.color
	);

	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.client.id);
	const role = getGameRole(playerId, players);

	const currentPhaseDeadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);

	const strokeWidth = useSelector(
		(state: RootState) => state.client.canvas.strokeWidth
	);

	// Update fillCanvasWithStroke to clip to canvas bounds
	const fillCanvasWithStroke = React.useCallback(
		(ctx: CanvasRenderingContext2D, stroke: Stroke) => {
			if (stroke.points.length === 0) return;

			ctx.save(); // Save the current context state
			ctx.beginPath();
			ctx.rect(0, 0, width * CANVAS_SCALE, height * CANVAS_SCALE);
			ctx.clip(); // Clip to canvas bounds

			ctx.beginPath();
			ctx.strokeStyle = stroke.color;
			ctx.fillStyle = stroke.color;
			ctx.lineWidth = stroke.width;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";

			// If we only have one point, draw a circle
			if (stroke.points.length === 1) {
				const [x, y] = stroke.points[0];
				ctx.beginPath();
				ctx.arc(x, y, stroke.width / 2, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore(); // Restore the context state
				return;
			}

			// Draw the line allowing points outside bounds
			ctx.moveTo(stroke.points[0][0], stroke.points[0][1]);

			for (let i = 1; i < stroke.points.length - 1; i++) {
				const xc = (stroke.points[i][0] + stroke.points[i + 1][0]) / 2;
				const yc = (stroke.points[i][1] + stroke.points[i + 1][1]) / 2;
				ctx.quadraticCurveTo(stroke.points[i][0], stroke.points[i][1], xc, yc);
			}

			if (stroke.points.length > 1) {
				const lastPoint = stroke.points[stroke.points.length - 1];
				ctx.lineTo(lastPoint[0], lastPoint[1]);
			}

			ctx.stroke();
			ctx.restore(); // Restore the context state
		},
		[width, height]
	);

	const roundIsActive = React.useMemo(() => {
		return new Date(currentPhaseDeadline).getTime() > Date.now();
	}, [currentPhaseDeadline]);

	const clearCanvas = (ctx: CanvasRenderingContext2D) => {
		ctx.clearRect(0, 0, width * CANVAS_SCALE, height * CANVAS_SCALE);
	};

	const drawAllStrokes = () => {
		const ctx = canvasRef.current?.getContext("2d");

		if (ctx) {
			clearCanvas(ctx);
			for (const stroke of strokes) {
				fillCanvasWithStroke(ctx, stroke);
			}
		}
	};

	const drawMostRecentStroke = () => {
		const canvasContext = canvasRef.current?.getContext("2d");
		const strokeCount = strokes.length;

		if (canvasContext && strokeCount) {
			const stroke = strokes[strokeCount - 1];
			fillCanvasWithStroke(canvasContext, stroke);
		}
	};

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

	// Update coordinate calculations
	const getScaledCoordinates = (
		clientX: number,
		clientY: number,
		rect: DOMRect
	) => {
		// Get the actual rendered size of the canvas
		const canvasElement = canvasRef.current;
		if (!canvasElement) return [0, 0];

		// Calculate the ratio between the canvas's display size and its drawing buffer size
		const displayToBufferRatioX =
			(width * CANVAS_SCALE) / canvasElement.offsetWidth;
		const displayToBufferRatioY =
			(height * CANVAS_SCALE) / canvasElement.offsetHeight;

		// Calculate coordinates relative to the canvas element
		const x = (clientX - rect.left) * displayToBufferRatioX;
		const y = (clientY - rect.top) * displayToBufferRatioY;

		return [x, y];
	};

	// Add an isDrawing ref to track stroke state
	const isDrawing = React.useRef(false);

	// Add a lastPoint ref to track where we left off
	const lastPointRef = React.useRef<[number, number] | null>(null);

	// Update the handlers
	const handleNewStroke = React.useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			if (!roundIsActive || e.button !== 0) return;

			isDrawing.current = true;
			lastPointRef.current = null; // Reset last point on new stroke
			const rect = e.currentTarget.getBoundingClientRect();
			const [x, y] = getScaledCoordinates(e.clientX, e.clientY, rect);

			dispatch(
				addStroke({
					color: strokeColor,
					width: strokeWidth,
					points: [[x, y]],
				})
			);
			dispatch(addRecentlyUsedColor(strokeColor));
		},
		[roundIsActive, dispatch, strokeColor, strokeWidth]
	);

	// Update handleStrokePoint to allow points slightly outside bounds
	const handleStrokePoint = React.useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			if (!isDrawing.current || e.buttons !== 1 || !roundIsActive) return;

			const rect = e.currentTarget.getBoundingClientRect();
			const [x, y] = getScaledCoordinates(e.clientX, e.clientY, rect);

			// Allow points slightly outside bounds to be recorded
			dispatch(addStrokePoint([x, y]));
		},
		[roundIsActive, dispatch]
	);

	// Update touch handler similarly
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
		[role, roundIsActive, dispatch]
	);

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
				dispatch(addRecentlyUsedColor(strokeColor));
			}
		},
		[role, roundIsActive, dispatch, strokeColor, strokeWidth]
	);

	const handleMouseMove = React.useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			if (role === GameRole.Drawing) {
				const cursor = cursorRef.current;
				if (cursor) {
					// Add tiny offset to fine-tune position
					cursor.style.display = "block";
					cursor.style.left = `${e.clientX + 2.5}px`; // Tiny offset right
					cursor.style.top = `${e.clientY + 2.5}px`; // Tiny offset down
					cursor.style.width = `${(strokeWidth * scaleFactor) / 2}px`;
					cursor.style.height = `${(strokeWidth * scaleFactor) / 2}px`;
					cursor.style.backgroundColor = `${strokeColor}33`;
					cursor.style.border = "1px solid white";
					cursor.style.boxShadow = "0 0 0 1px grey";
					cursor.style.transform = "translate(-50%, -50%)";
					cursor.style.position = "fixed";
				}
			}
		},
		[role, strokeWidth, strokeColor, scaleFactor]
	);

	const handleMouseLeave = React.useCallback(() => {
		if (role === GameRole.Drawing) {
			const cursor = cursorRef.current;
			if (cursor) {
				cursor.style.display = "none";
			}
		}
	}, [role]);

	return (
		<div
			style={{
				width: width * scaleFactor - (padding ?? 0),
				height: height * scaleFactor - (padding ?? 0),
			}}
			className="relative mb-2"
		>
			<canvas
				className={`border-[3px] border-border rounded-lg bg-background w-full h-full relative z-10 ${
					role === GameRole.Drawing ? "cursor-none" : ""
				}`}
				width={width * CANVAS_SCALE - (padding ?? 0)}
				height={height * CANVAS_SCALE - (padding ?? 0)}
				onMouseDown={handleNewStroke}
				onMouseMove={(e) => {
					handleMouseMove(e);
					handleStrokePoint(e);
				}}
				onMouseUp={() => {
					isDrawing.current = false;
				}}
				onMouseLeave={(e) => {
					handleMouseLeave();
					// Add one final point as we leave
					if (isDrawing.current) {
						const rect = e.currentTarget.getBoundingClientRect();
						const [x, y] = getScaledCoordinates(e.clientX, e.clientY, rect);
						dispatch(addStrokePoint([x, y]));
						isDrawing.current = false;
					}
				}}
				onMouseEnter={(e) => {
					// If still holding mouse button, start a new stroke
					if (e.buttons === 1 && role === GameRole.Drawing && roundIsActive) {
						const rect = e.currentTarget.getBoundingClientRect();
						const [x, y] = getScaledCoordinates(e.clientX, e.clientY, rect);

						isDrawing.current = true;
						dispatch(
							addStroke({
								color: strokeColor,
								width: strokeWidth,
								points: [[x, y]],
							})
						);
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
						position: "absolute",
					}}
				/>
			)}
		</div>
	);
}

export default Canvas;
