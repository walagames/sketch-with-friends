import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { GameRole } from "@/state/features/game";
import { addStroke, addStrokePoint, Stroke } from "@/state/features/canvas";
import { useWindowSize } from "@/hooks/use-window-size";
import { getGameRole } from "@/lib/player";
import { addRecentlyUsedColor } from "@/state/features/client";
import { useMediaQuery } from "@/hooks/use-media-query";
import { CanvasTool } from "@/state/features/client";

const CANVAS_SCALE = 2;
const MOBILE_OFFSET = 10;

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
	const currentTool = useSelector(
		(state: RootState) => state.client.canvas.tool
	);

	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.client.id);
	const role = getGameRole(playerId, players);

	const isLargeScreen = useMediaQuery("(min-width: 1024px)");

	const currentPhaseDeadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);

	const strokeWidth = useSelector(
		(state: RootState) => state.client.canvas.strokeWidth
	);

	const fillCanvasWithStroke = (
		ctx: CanvasRenderingContext2D,
		stroke: Stroke
	) => {
		if (stroke.points.length === 0) return;

		if (stroke.type === "fill") {
			const [x, y] = stroke.points[0];
			const imageData = ctx.getImageData(
				0,
				0,
				width * CANVAS_SCALE,
				height * CANVAS_SCALE
			);
			const pixelData = new Uint8ClampedArray(imageData.data);

			const getPixel = (x: number, y: number) => {
				if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) {
					return [-1, -1, -1, -1]; // impossible color
				}
				const i = (y * imageData.width + x) * 4;
				return [
					pixelData[i], // r
					pixelData[i + 1], // g
					pixelData[i + 2], // b
					pixelData[i + 3], // a
				];
			};

			const setPixel = (x: number, y: number, [r, g, b, a]: number[]) => {
				const i = (y * imageData.width + x) * 4;
				pixelData[i] = r;
				pixelData[i + 1] = g;
				pixelData[i + 2] = b;
				pixelData[i + 3] = a;
			};

			const fillColorHex = stroke.color.replace("#", "");
			const fillR = parseInt(fillColorHex.slice(0, 2), 16);
			const fillG = parseInt(fillColorHex.slice(2, 4), 16);
			const fillB = parseInt(fillColorHex.slice(4, 6), 16);
			const fillColor = [fillR, fillG, fillB, 255];

			const targetColor = getPixel(Math.floor(x), Math.floor(y));

			const colorMatch = (c1: number[], c2: number[]) => {
				if (c1[0] === -1 || c2[0] === -1) return false;
				const tolerance = 100;
				const alphaTolerance = 64;
				return (
					Math.abs(c1[0] - c2[0]) <= tolerance &&
					Math.abs(c1[1] - c2[1]) <= tolerance &&
					Math.abs(c1[2] - c2[2]) <= tolerance &&
					Math.abs(c1[3] - c2[3]) <= alphaTolerance
				);
			};

			if (!colorMatch(targetColor, fillColor)) {
				const spansToCheck: {
					left: number;
					right: number;
					y: number;
					direction: number;
				}[] = [];

				const addSpan = (
					left: number,
					right: number,
					y: number,
					direction: number
				) => {
					spansToCheck.push({
						left: Math.max(0, left - 1),
						right: Math.min(imageData.width - 1, right + 1),
						y,
						direction,
					});
				};

				const checkSpan = (
					left: number,
					right: number,
					y: number,
					direction: number
				) => {
					let inSpan = false;
					let start = 0;
					let x;

					for (x = left; x < right; ++x) {
						const color = getPixel(x, y);
						if (colorMatch(color, targetColor)) {
							if (!inSpan) {
								inSpan = true;
								start = x;
							}
						} else {
							if (inSpan) {
								inSpan = false;
								addSpan(start, x - 1, y, direction);
							}
						}
					}
					if (inSpan) {
						inSpan = false;
						addSpan(start, x - 1, y, direction);
					}
				};

				addSpan(Math.floor(x), Math.floor(x), Math.floor(y), 0);

				while (spansToCheck.length > 0) {
					const { left, right, y, direction } = spansToCheck.pop()!;

					let l = left;
					for (;;) {
						--l;
						const color = getPixel(l, y);
						if (!colorMatch(color, targetColor)) {
							break;
						}
					}
					++l;

					let r = right;
					for (;;) {
						++r;
						const color = getPixel(r, y);
						if (!colorMatch(color, targetColor)) {
							break;
						}
					}

					// Fill the span
					for (let x = l; x < r; x++) {
						setPixel(x, y, fillColor);
					}

					if (direction <= 0) {
						checkSpan(l, r, y - 1, -1);
					} else {
						checkSpan(l, left, y - 1, -1);
						checkSpan(right, r, y - 1, -1);
					}

					if (direction >= 0) {
						checkSpan(l, r, y + 1, +1);
					} else {
						checkSpan(l, left, y + 1, +1);
						checkSpan(right, r, y + 1, +1);
					}
				}

				imageData.data.set(pixelData);
				ctx.putImageData(imageData, 0, 0);
			}
			return;
		}

		// Handle brush strokes
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
	};

	const drawingTime = useSelector(
		(state: RootState) => state.room.settings.drawingTimeAllowed
	);

	const roundIsActive = () => {
		const currentTime = Date.now();
		const startingAnimationActive =
			drawingTime -
				(new Date(currentPhaseDeadline).getTime() - Date.now()) / 1000 <
			1.5;
		const deadlineTime = new Date(currentPhaseDeadline).getTime();
		const timeSinceStart = deadlineTime - currentTime;
		return timeSinceStart > 0 && !startingAnimationActive;
	};

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

	const [scaleFactor, setScaleFactor] = React.useState(1);

	React.useEffect(() => {
		const widthScale = windowWidth / width;
		const heightScale = windowHeight / height;
		const newScale = Math.min(widthScale, heightScale, 1);
		setScaleFactor(newScale);
	}, [windowWidth, windowHeight, width, height]);

	// Update cordinate calculations
	const getScaledCoordinates = (
		clientX: number,
		clientY: number,
		rect: DOMRect
	) => {
		const canvasElement = canvasRef.current;
		if (!canvasElement) return [0, 0];

		const displayToBufferRatioX =
			(width * CANVAS_SCALE) / canvasElement.offsetWidth;
		const displayToBufferRatioY =
			(height * CANVAS_SCALE) / canvasElement.offsetHeight;

		const x = (clientX - rect.left) * displayToBufferRatioX;
		const y = (clientY - rect.top) * displayToBufferRatioY;

		return [x, y];
	};

	const isDrawing = React.useRef(false);

	const lastPointRef = React.useRef<[number, number] | null>(null);

	const handleNewStroke = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!roundIsActive() || e.button !== 0 || role !== GameRole.Drawing) return;

		isDrawing.current = true;
		lastPointRef.current = null; // Reset last point on new stroke
		const rect = e.currentTarget.getBoundingClientRect();
		const [x, y] = getScaledCoordinates(
			e.clientX,
			e.clientY - (isLargeScreen ? 0 : MOBILE_OFFSET),
			rect
		);

		dispatch(
			addStroke({
				color: strokeColor,
				width: strokeWidth,
				points: [[x, y]],
				type: "brush",
			})
		);
		dispatch(addRecentlyUsedColor(strokeColor));
	};

	const handleStrokePoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (
			!isDrawing.current ||
			e.buttons !== 1 ||
			!roundIsActive ||
			role !== GameRole.Drawing
		)
			return;

		const rect = e.currentTarget.getBoundingClientRect();
		const [x, y] = getScaledCoordinates(
			e.clientX,
			e.clientY - (isLargeScreen ? 0 : MOBILE_OFFSET),
			rect
		);

		// Allow points slightly outside bounds to be recorded
		dispatch(addStrokePoint([x, y]));
	};

	const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
		if (role === GameRole.Drawing && roundIsActive()) {
			e.preventDefault();
			const rect = e.currentTarget.getBoundingClientRect();
			const touch = e.touches[0];
			const [x, y] = getScaledCoordinates(
				touch.clientX,
				touch.clientY - (isLargeScreen ? 0 : MOBILE_OFFSET),
				rect
			);

			dispatch(addStrokePoint([x, y]));
		}
	};

	const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
		if (role === GameRole.Drawing && roundIsActive()) {
			e.preventDefault();
			const rect = e.currentTarget.getBoundingClientRect();
			const touch = e.touches[0];
			const [x, y] = getScaledCoordinates(
				touch.clientX,
				touch.clientY - (isLargeScreen ? 0 : MOBILE_OFFSET),
				rect
			);
			dispatch(
				addStroke({
					color: strokeColor,
					width: strokeWidth,
					points: [[x, y]],
				})
			);
			dispatch(addRecentlyUsedColor(strokeColor));
		}
	};

	const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (role === GameRole.Drawing && roundIsActive()) {
			const cursor = cursorRef.current;
			if (cursor && isLargeScreen) {
				cursor.style.display = "block";
				cursor.style.left = `${e.clientX + 2.5}px`;
				cursor.style.top = `${e.clientY + 2.5}px`;
				cursor.style.width = `${(strokeWidth * scaleFactor) / 2}px`;
				cursor.style.height = `${(strokeWidth * scaleFactor) / 2}px`;
				cursor.style.backgroundColor = `${strokeColor}33`;
				cursor.style.border = "1px solid white";
				cursor.style.boxShadow = "0 0 0 1px grey";
				cursor.style.transform = "translate(-50%, -50%)";
				cursor.style.position = "fixed";
			}
		}
	};

	const handleMouseLeave = () => {
		if (role === GameRole.Drawing && roundIsActive()) {
			const cursor = cursorRef.current;
			if (cursor) {
				cursor.style.display = "none";
			}
		}
	};

	const handleFloodFill = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!roundIsActive() || e.button !== 0 || role !== GameRole.Drawing) return;

		const ctx = canvasRef.current?.getContext("2d");
		if (!ctx) return;

		const rect = e.currentTarget.getBoundingClientRect();
		const [x, y] = getScaledCoordinates(
			e.clientX,
			e.clientY - (isLargeScreen ? 0 : MOBILE_OFFSET),
			rect
		);

		// Create a fill stroke
		const fillStroke: Stroke = {
			color: strokeColor,
			width: 0,
			points: [[x, y]],
			type: "fill",
		};

		// Apply the fill
		fillCanvasWithStroke(ctx, fillStroke);

		// Add the flood fill as a stroke
		dispatch(addStroke(fillStroke));
		dispatch(addRecentlyUsedColor(strokeColor));
	};

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
				onMouseDown={(e) => {
					if (currentTool === CanvasTool.Bucket) {
						handleFloodFill(e);
					} else {
						handleNewStroke(e);
					}
				}}
				onMouseMove={(e) => {
					if (roundIsActive()) {
						handleMouseMove(e);
						handleStrokePoint(e);
					}
				}}
				onMouseUp={() => {
					isDrawing.current = false;
				}}
				onMouseLeave={(e) => {
					handleMouseLeave();
					if (isDrawing.current) {
						const rect = e.currentTarget.getBoundingClientRect();
						const [x, y] = getScaledCoordinates(
							e.clientX,
							e.clientY - (isLargeScreen ? 0 : MOBILE_OFFSET),
							rect
						);
						dispatch(addStrokePoint([x, y]));
						isDrawing.current = false;
					}
				}}
				onMouseEnter={(e) => {
					if (e.buttons === 1 && role === GameRole.Drawing && roundIsActive()) {
						const rect = e.currentTarget.getBoundingClientRect();

						const [x, y] = getScaledCoordinates(
							e.clientX,
							e.clientY - (isLargeScreen ? 0 : MOBILE_OFFSET),
							rect
						);

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
