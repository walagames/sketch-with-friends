import * as React from "react";
import { getStroke } from "perfect-freehand";
import pako from 'pako';

import {
	ContextMenu,
	ContextMenuTrigger,
	ContextMenuContent,
} from "./ui/context-menu";
import { HexColorPicker } from "react-colorful";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { GameRole } from "@/state/features/game";
import {
	addElement,
	addStroke,
	updateStrokePoints,
	addFill,
	CanvasElement,
	StrokeElement,
	FillElement,
} from "@/state/features/canvas";
import { CanvasTool } from "@/state/features/client";
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
	const maskCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
	const isProcessingMasksRef = React.useRef(false);
	const cursorRef = React.useRef<HTMLDivElement | null>(null);
	const elementCountRef = React.useRef(0);

	const [windowWidth, windowHeight] = useWindowSize();

	const dispatch = useDispatch();
	const elements = useSelector((state: RootState) => state.canvas.elements);

	const hue = useSelector((state: RootState) => state.client.canvas.hue);
	const lightness = useSelector(
		(state: RootState) => state.client.canvas.lightness
	);
	const strokeWidth = useSelector(
		(state: RootState) => state.client.canvas.strokeWidth
	);
	const tool = useSelector((state: RootState) => state.client.canvas.tool);

	const currentPhaseDeadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);

	const roundIsActive = React.useMemo(() => {
		return new Date(currentPhaseDeadline).getTime() > Date.now();
	}, [currentPhaseDeadline]);

	const toolColor = React.useMemo(() => {
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

	const renderStroke = React.useCallback(
		(ctx: CanvasRenderingContext2D, stroke: StrokeElement) => {
			console.log("Rendering stroke:", stroke);
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

	const renderFill = React.useCallback(
		(ctx: CanvasRenderingContext2D, fill: FillElement) => {
			console.log("Rendering fill:", fill);
			const canvas = canvasRef.current;
			if (!canvas) return;

			const width = canvas.width;
			const height = canvas.height;

			const decompressedPixels = pako.inflate(fill.pixels);
			const fillWidth = fill.width;
			const fillHeight = fill.height;
			const [fillX, fillY] = fill.point;

			// Create a blank ImageData object for the full canvas
			const fullCanvasImageData = ctx.createImageData(width, height);

			// Copy the decompressed pixels into the correct position within the full canvas ImageData
			for (let row = 0; row < fillHeight; row++) {
				for (let col = 0; col < fillWidth; col++) {
					const fillIndex = (row * fillWidth + col) * 4;
					const canvasIndex = ((fillY + row) * width + (fillX + col)) * 4;

					fullCanvasImageData.data[canvasIndex] = decompressedPixels[fillIndex];       // R
					fullCanvasImageData.data[canvasIndex + 1] = decompressedPixels[fillIndex + 1]; // G
					fullCanvasImageData.data[canvasIndex + 2] = decompressedPixels[fillIndex + 2]; // B
					fullCanvasImageData.data[canvasIndex + 3] = decompressedPixels[fillIndex + 3]; // A
				}
			}

			// Render the full canvas ImageData
			console.log("putting fill image data", fullCanvasImageData);
			ctx.putImageData(fullCanvasImageData, 0, 0);
		},
		[]
	);
	
	const clearCanvas = React.useCallback(
		(ctx: CanvasRenderingContext2D) => {
			ctx.clearRect(0, 0, width * CANVAS_SCALE, height * CANVAS_SCALE);
		},
		[width, height]
	);

	const renderElement = React.useCallback((context: CanvasRenderingContext2D, element: CanvasElement) => {
		switch (element.type) {
			case 'stroke':
				renderStroke(context, element as StrokeElement);
				break;
			case 'fill':	
				renderFill(context, element as FillElement);
				break;
		}
	}, []);

	// const [masksProcessed, setMasksProcessed] = React.useState(false);

	const renderAllElements = React.useCallback(() => {
		const context = canvasRef.current?.getContext("2d", { willReadFrequently: true });
		if (context) {
			clearCanvas(context);
			// setMasksProcessed(false); // Reset mask processing state
			elements.forEach(element => {
				renderElement(context, element);
			});
		}
	}, [renderElement, elements]);

	const renderMostRecentElement = React.useCallback(() => {
		const context = canvasRef.current?.getContext("2d");
		const elementCount = elements.length;

		if (context && elementCount) {
			const element = elements[elementCount - 1];
			renderElement(context, element);

			if (element.type === 'fill' || (element.type === 'stroke' && !(element as StrokeElement).isPartial)) {
				processMasks();
			}
		}
	}, [renderElement, elements, processMasks]);

	// Draws all elements on first load and when window size changes
	React.useEffect(() => {
		const isWindowInitialized = width !== 0 && height !== 0;

		if (isWindowInitialized && canvasRef.current) {
			const context = canvasRef.current.getContext("2d");
			if (context) {
				renderAllElements();
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [width, height]);

	const lastPointsRef = React.useRef<number[][]>([]);

	// Only draws most recent element unless canvas is cleared or an element is undone
	React.useEffect(() => {
		const isWindowInitialized = width !== 0 && height !== 0;
		const newElementCount = elements.length;
		const lastElement = elements[elements.length - 1];

		const hasPointsChanged = lastElement?.type === 'stroke' && 
			JSON.stringify((lastElement as StrokeElement).points) !== 
			JSON.stringify(lastPointsRef.current);

		// Check if this is a stroke completion update
		const isStrokeCompletion = lastElement?.type === 'stroke' && 
			!(lastElement as StrokeElement).isPartial && 
			(lastElement as StrokeElement).points.length > 0;

		if (elementCountRef.current > newElementCount || elements.length === 0) {
			// Undo stroke or clear canvas
			renderAllElements();
		} else if (elements.length > 0 && (isWindowInitialized || hasPointsChanged || isStrokeCompletion)) {
			renderMostRecentElement();

			// Update the points reference
			if (lastElement?.type === 'stroke') {
				lastPointsRef.current = [...(lastElement as StrokeElement).points];
			}
		}

		elementCountRef.current = newElementCount;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [elements]);

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

	// Processes the mask canvas to prepare for flood fill (find color regions)
	function processMasks() {
		if (isProcessingMasksRef.current) return; // Already processing, so ignore
		isProcessingMasksRef.current = true;

		const canvas = canvasRef.current;
		const maskCanvas = maskCanvasRef.current;
		if (!canvas || !maskCanvas) return;
	  
		const context = canvas.getContext("2d", { willReadFrequently: true });
		const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
		if (!context || !maskCtx) return;
	  
		createImageBitmap(canvas)
			.then(bitmap => {
				maskCanvas.width = canvas.width;
				maskCanvas.height = canvas.height;
				maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
				maskCtx.drawImage(bitmap, 0, 0);
			
				const dimensions = { height: canvas.height, width: canvas.width };
				const sourceImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
			
				workerRef.current?.postMessage(
					{
						action: "process",
						dimensions,
						buffer: sourceImageData.data.buffer,
					},
					[sourceImageData.data.buffer]
				);
			})
			.finally(() => {
				isProcessingMasksRef.current = false; // Reset flag after processing
			});
	}

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
			canvas.removeEventListener("mouseenter", () => { });
			canvas.removeEventListener("mouseleave", () => { });
		};
	}, [role]);

	React.useEffect(() => {
		const cursor = cursorRef.current;
		if (!cursor) return;
		// if (tool !== CanvasTool.Brush) return;

		const size = strokeWidth * 0.5; // Adjust this multiplier as needed
		cursor.style.width = `${size}px`;
		cursor.style.height = `${size}px`;
		cursor.style.backgroundColor = `${toolColor}33`; // 33 is 20% opacity in hex
		cursor.style.border = `1px solid white`;
		cursor.style.boxShadow = `0 0 0 1px grey`;
	}, [toolColor, strokeWidth]);

	const [currentStrokeId, setCurrentStrokeId] = React.useState<string | null>(null);
	const pointsBatchRef = React.useRef<number[][]>([]);
	const batchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

	const handleNewStroke = React.useCallback(
		(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
			const rect = e.currentTarget.getBoundingClientRect();
			const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
			const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
			const [x, y] = getScaledCoordinates(clientX, clientY, rect);
			
			pointsBatchRef.current = [[x, y]];
			const newStroke = addStroke(toolColor, strokeWidth, [[x, y]]);
			setCurrentStrokeId(newStroke.id);
			dispatch(addElement(newStroke));
		},
		[toolColor, strokeWidth, getScaledCoordinates, dispatch]
	);

	const handleStrokePoint = React.useCallback(
		(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
			if (!currentStrokeId) return;

			const rect = e.currentTarget.getBoundingClientRect();
			const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
			const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
			const point = getScaledCoordinates(clientX, clientY, rect);

			pointsBatchRef.current.push(point);

			// Send batch immediately if we have enough points
			if (pointsBatchRef.current.length >= 1) {
				if (batchTimeoutRef.current) {
					clearTimeout(batchTimeoutRef.current);
					batchTimeoutRef.current = null;
				}

				dispatch(updateStrokePoints({
					id: currentStrokeId,
					points: pointsBatchRef.current,
					isPartial: true
				}));
				pointsBatchRef.current = [];
			}
			// Set a shorter timeout for remaining points
			else if (!batchTimeoutRef.current) {
				batchTimeoutRef.current = setTimeout(() => {
					if (currentStrokeId && pointsBatchRef.current.length > 3) {
						dispatch(updateStrokePoints({
							id: currentStrokeId,
							points: pointsBatchRef.current,
							isPartial: true
						}));
						pointsBatchRef.current = [];
					}
				}, 16); // Reduced from 50ms to 16ms (roughly one frame)
			}
		},
		[currentStrokeId, dispatch, getScaledCoordinates]
	);

	const handleStrokeEnd = React.useCallback(
		() => {
			if (!currentStrokeId) return;
			
			if (batchTimeoutRef.current) {
				clearTimeout(batchTimeoutRef.current);
				batchTimeoutRef.current = null;
			}

			dispatch(updateStrokePoints({
				id: currentStrokeId,
				points: [...pointsBatchRef.current],
				isPartial: false
			}));

			setCurrentStrokeId(null);
			pointsBatchRef.current = [];
		},
		[currentStrokeId, dispatch, elements]
	);

	const handleBucketFill = React.useCallback(
		(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
			const rect = e.currentTarget.getBoundingClientRect();
			const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
			const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
			const [x, y] = getScaledCoordinates(clientX, clientY, rect);

			const context = canvasRef.current?.getContext("2d");
			const maskContext = maskCanvasRef.current?.getContext("2d");
			if (!context || !maskContext) return;
			
			bucketFill([x, y], toolColor, context, maskContext, (pixelData) => {
				if (pixelData) {
					console.log("elements", elements);
					const newFill = addFill([pixelData.x, pixelData.y], toolColor, pixelData.data, pixelData.width, pixelData.height);
					// dispatch(addElement(newFill));
				}
			});
		},
		[toolColor, getScaledCoordinates, dispatch]
	);

	function handleCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
		if (role !== GameRole.Drawing || !roundIsActive) return;
		if (e.button === 0) {
			if (tool === CanvasTool.Brush) {
				handleNewStroke(e);
			} else if (tool === CanvasTool.Bucket) {
				handleBucketFill(e);
			}
		}
	}

	function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
		if (role !== GameRole.Drawing || !roundIsActive) return;
		if (e.buttons === 1) {
			if (tool === CanvasTool.Brush) {
				handleStrokePoint(e);
			}
		}
	}

	function handleCanvasMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
		if (role !== GameRole.Drawing || !roundIsActive) return;
		if (e.button === 0) {
			if (tool === CanvasTool.Brush) {
				handleStrokeEnd();
			}
		}
	}

	const handleTouchStart = React.useCallback(
		(e: React.TouchEvent<HTMLCanvasElement>) => {
			if (role !== GameRole.Drawing || !roundIsActive) return;
			if (tool === CanvasTool.Brush) {
				handleNewStroke(e);
			} else if (tool === CanvasTool.Bucket) {
				handleBucketFill(e);
			}
		},
		[toolColor, strokeWidth, role, getScaledCoordinates, roundIsActive, dispatch]
	);

	const handleTouchMove = React.useCallback(
		(e: React.TouchEvent<HTMLCanvasElement>) => {
			if (role !== GameRole.Drawing || !roundIsActive) return;
			if (tool === CanvasTool.Brush) {
				handleStrokePoint(e);
			}
		},
		[dispatch, role, getScaledCoordinates, roundIsActive]
	);

	// Define a type for the mask information
	type MaskInfo = {
		node: HTMLCanvasElement;
		data: ImageData;
		pixelMaskInfo: any;
	};

	// Initialize maskInfoRef with the correct type
	let maskInfoRef = React.useRef<MaskInfo | null>(null);
	const workerRef = React.useRef<Worker | null>(null);

	React.useEffect(() => {
		workerRef.current = new Worker(new URL("../workers/floodfill-worker.js", import.meta.url));
		workerRef.current.onmessage = (e) => {
			const { data } = e;
			switch (data.response) {
				case "fill": {
					const context = canvasRef.current?.getContext("2d");
					if (context) {
						handleFillMessageFromWorker(data, context);
					}
					break;
				}
				case "process":
					handleProcessMessageFromWorker(data);
					break;
				default:
					console.error("Unknown response from worker", data);
			}
		};

		return () => {
			workerRef.current?.terminate();
		};
	}, []);

	const handleFillMessageFromWorker = React.useCallback((data: any, context: CanvasRenderingContext2D | null) => {
		const { height, width, pixels } = data;

		if (!pixels) {
			// No change was made
			return;
		}
		const imageData = new ImageData(width, height);
		imageData.data.set(new Uint8ClampedArray(pixels));

		const { canvas: tempCanvas, context: tempContext } = makeCanvas({
			height,
			width,
		});
		if (tempContext) {
			tempContext.putImageData(imageData, 0, 0);
		}

		// Draw the full image
		if (context) {
			context.drawImage(tempCanvas, 0, 0);
		}
	}, []);

	const handleProcessMessageFromWorker = React.useCallback((data: any) => {
		const { height, width, allPixels: pixels } = data;
		const pixelMaskInfo = data.pixelMaskInfo;

		if (width !== canvasRef.current?.width || height != canvasRef.current?.height) {
			// Outdated data, the screen has changed size, so ignore it
			return;
		}

		const { canvas: tempCanvas, context: tempContext } = makeCanvas({
			height,
			width,
		});

		const imageData = new ImageData(width, height);
		imageData.data.set(new Uint8ClampedArray(pixels));

		if (tempContext) {
			tempContext.putImageData(imageData, 0, 0);

			// Store the mask info for use when the user clicks a pixel
			maskInfoRef.current = {
				node: tempCanvas,
				data: tempContext.getImageData(0, 0, width, height),
				pixelMaskInfo,
			};

			// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing#globalcompositeoperation
			// This is the magic incantation that gets all this canvas sorcery to work!!
			// It makes it so that the fillRect() call later only fills in the non-transparent
			// pixels and leaves the others transparent.  This way, only the background of the image is
			// coloured in and the main subject is left as an empty 'mask' in this canvas.
			// We can then easily use drawImage to place that masked image on top of the
			// canvas the user is drawing
			tempContext.globalCompositeOperation = "source-in";
		}
	}, []);

	// should just calculate the changed points and send them back
	// currently filling pixels which should really be done in renderFill (looks like it should but doesn't ...)
	const bucketFill = React.useCallback(
		(
			point: [number, number],
			colour: string,
			context: CanvasRenderingContext2D | null,
			sourceContext: CanvasRenderingContext2D,
			onPixelsFilled: (pixelData: { data: Uint8Array, x: number, y: number, width: number, height: number } | null) => void
		): void => {
			console.log("bucketFill", point, colour);
			let [x, y] = point;
			x = Math.floor(x);
			y = Math.floor(y);

			const maskInfo = maskInfoRef.current;
			if (maskInfo) {
				const firstIdx = getColorIndexForCoord(x, y, maskInfo.node.width);
				const alphaValue = maskInfo.data.data[firstIdx + 3];

				if (alphaValue > 0) {
					const pixelMaskInfo = maskInfo.pixelMaskInfo[alphaValue - 1];
					let maskDataUrl = pixelMaskInfo.dataUrl;

					const { canvas: pixelMaskCanvasNode, context: pixelMaskContext } =
						makeCanvas({
							height: pixelMaskInfo.height,
							width: pixelMaskInfo.width,
						});

					function performDraw() {
						if (pixelMaskContext) {
							pixelMaskContext.globalCompositeOperation = "source-in";
							pixelMaskContext.fillStyle = toolColor;
							pixelMaskContext.fillRect(
								0,
								0,
								pixelMaskInfo.width,
								pixelMaskInfo.height
							);
							context?.drawImage(
								pixelMaskCanvasNode,
								pixelMaskInfo.x,
								pixelMaskInfo.y
							);
						}
					}

					if (!maskDataUrl) {
						const pixelMaskImageData = new ImageData(
							pixelMaskInfo.width,
							pixelMaskInfo.height
						);
						pixelMaskImageData.data.set(
							new Uint8ClampedArray(pixelMaskInfo.pixels)
						);
						pixelMaskContext?.putImageData(pixelMaskImageData, 0, 0);
						performDraw();
					} else {
						const img = new Image();
						img.onload = () => {
							pixelMaskContext?.drawImage(img, 0, 0);
							performDraw();
						};
						img.src = maskDataUrl;
					}
				}
			}

			const dimensions = {
				height: canvasRef.current?.height ?? 0,
				width: canvasRef.current?.width ?? 0,
			};

			const currentImageData = context?.getImageData(
				0,
				0,
				dimensions.width,
				dimensions.height
			);

			const sourceImageData = sourceContext.getImageData(
				0,
				0,
				dimensions.width,
				dimensions.height
			);

			workerRef.current?.postMessage(
				{
					action: "fill",
					dimensions,
					sourceImageData: sourceImageData.data.buffer,
					currentImageData: currentImageData?.data.buffer,
					x,
					y,
					colour,
				},
				[currentImageData?.data.buffer].filter(Boolean) as Transferable[]
			);

			// Handle the worker's response
			workerRef.current?.addEventListener("message", (e) => {
				const { data } = e;
				if (data.response === "fill" && context) {
					const boundingBox = calculateBoundingBox(new Uint8ClampedArray(data.pixels), dimensions.width, dimensions.height);
					
					// Use the bounding box to get delta data
					const deltaData = getDeltaData(context, [
						{ x: boundingBox.x, y: boundingBox.y, width: boundingBox.width, height: boundingBox.height },
					]);

					const pixelData = compressDeltaData(deltaData);

					if (pixelData.length === 1) {
						console.log("pixel fill return");
						onPixelsFilled(pixelData[0]);
					} else {
						console.warn("Unexpected number of pixel data", pixelData);
					}
				}
			}, { once: true }); // Ensure the event listener is only triggered once
		},
		[]
	);

	function getDeltaData(
		context: CanvasRenderingContext2D,
		changes: { x: number; y: number; width: number; height: number }[]
	) {
		const deltaData = changes.map((change) => {
			const imageData = context.getImageData(
				change.x,
				change.y,
				change.width,
				change.height
			);
			return {
				x: change.x,
				y: change.y,
				width: change.width,
				height: change.height,
				data: imageData.data,
			};
		});
		return deltaData;
	}

	function compressDeltaData(deltaData: any) {
		return deltaData.map((change: any) => {
			if (!change || !change.data) {
				console.warn("Skipping undefined or null change data");
				return null; // or handle it in a way that makes sense for your application
			}
			const compressedData = pako.deflate(change.data);
			return {
				...change,
				data: compressedData,
			};
		}).filter(Boolean); // Remove any null entries from the result
	}

	function makeCanvas(size: { width: number; height: number }) {
		const tempCanvas = document.createElement("canvas");
		if (size) {
			tempCanvas.width = size.width;
			tempCanvas.height = size.height;
		}
		const tempContext = tempCanvas.getContext("2d");

		return { canvas: tempCanvas, context: tempContext };
	}

	// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
	function getColorIndexForCoord(x: number, y: number, width: number) {
		return y * (width * 4) + x * 4;
	}

	function calculateBoundingBox(pixels: Uint8ClampedArray, width: number, height: number): { x: number, y: number, width: number, height: number } {
		let minX = width, minY = height, maxX = 0, maxY = 0;
		let hasChanged = false;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const index = (y * width + x) * 4; // Calculate the index for the RGBA values
				const alpha = pixels[index + 3]; // Check the alpha value to see if the pixel is changed

				if (alpha !== 0) { // Assuming non-zero alpha indicates a change
					hasChanged = true;
					if (x < minX) minX = x;
					if (y < minY) minY = y;
					if (x > maxX) maxX = x;
					if (y > maxY) maxY = y;
				}
			}
		}

		if (!hasChanged) {
			return { x: 0, y: 0, width: 0, height: 0 }; // No change detected
		}

		return {
			x: minX,
			y: minY,
			width: maxX - minX + 1,
			height: maxY - minY + 1
		};
	}

	return (
		<ContextMenu>
			<ContextMenuTrigger
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
					onMouseDown={handleCanvasMouseDown}
					onMouseMove={handleCanvasMouseMove}
					onMouseUp={handleCanvasMouseUp}
					width={width * CANVAS_SCALE - (padding ?? 0)}
					height={height * CANVAS_SCALE - (padding ?? 0)}
					onTouchStart={handleTouchStart}
					onTouchMove={handleTouchMove}
					ref={canvasRef}
				/>
				<canvas
					ref={maskCanvasRef}
					style={{ display: 'none' }}  // hide (for processing only)
					width={width * CANVAS_SCALE - (padding ?? 0)}
					height={height * CANVAS_SCALE - (padding ?? 0)}
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
					color={toolColor}
				// onChange={(color) => dispatch(change)}
				/>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export default Canvas;
