import * as React from "react";
import { getStroke } from "perfect-freehand";
import { useRoomContext } from "./room-provider";
import { PlayerAction } from "@/lib/types";

const options = {
	size: 18,
	thinning: 0.5,
	smoothing: 0.5,
	streamline: 0.5,
	easing: (t: number) => t,
	start: {
		taper: 0,
		easing: (t: number) => t,
		cap: true,
	},
	end: {
		taper: 100,
		easing: (t: number) => t,
		cap: true,
	},
};

// Need to store an array of objects
// Each object is a stroke with points and options like color, width
// Each point is an array of [x, y, preassure]
// When we start a new stroke, we push a new object to the array, otherwise we push points to the last object

function Canvas() {
	const { sendEvent, state, handleStrokeStart, handleStroke } =
		useRoomContext();
	const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
	const containerRef = React.useRef<HTMLDivElement | null>(null);
	const [context, setContext] = React.useState<CanvasRenderingContext2D | null>(
		null
	);
	React.useEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			const ctx = canvas.getContext("2d");
			if (ctx) {
				setContext(ctx);
			}
		}
	}, []);

	function draw() {
		if (context) {
			const stroke = getStroke(state.points, options);
			const pathData = getSvgPathFromStroke(stroke);
			const myPath = new Path2D(pathData);
			context.fill(myPath);
		}
	}

	React.useEffect(() => {
		if (context) {
			draw();
		}
	}, [state.points]);

	React.useEffect(() => {
		// Handler to call on window resize
		function handleResize() {
			// Set window width/height to state
			if (canvasRef.current && containerRef.current) {
				canvasRef.current.width = containerRef.current.clientWidth * 2;
				canvasRef.current.height = containerRef.current.clientHeight * 2;
				canvasRef.current.style.width = `${containerRef.current.clientWidth}px`;
				canvasRef.current.style.height = `${containerRef.current.clientHeight}px`;
				draw();
			}
		}
		// Add event listener
		window.addEventListener("resize", handleResize);
		// Call handler right away so state gets updated with initial window size
		handleResize();
		// Remove event listener on cleanup
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	function handlePointerDown(e: React.MouseEvent<HTMLCanvasElement>) {
		handleStrokeStart([e.pageX * 2, e.pageY * 2]);
		sendEvent(PlayerAction.STROKE, [e.pageX * 2, e.pageY * 2]);
	}

	function handlePointerMove(e: React.MouseEvent<HTMLCanvasElement>) {
		if (e.buttons !== 1) return;
		handleStroke([e.pageX * 2, e.pageY * 2]);
		sendEvent(PlayerAction.STROKE, [e.pageX * 2, e.pageY * 2]);
	}

	return (
		<div ref={containerRef} className="w-full h-full">
			<canvas
				style={{
					width: 2040,
					height: 1000,
				}}
				className="border"
				width={4080}
				height={2000}
				onMouseDown={handlePointerDown}
				onMouseMove={handlePointerMove}
				ref={canvasRef}
			/>
		</div>
	);
}

const average = (a: number, b: number) => (a + b) / 2;

function getSvgPathFromStroke(points: number[][], closed = true) {
	const len = points.length;

	if (len < 4) {
		return ``;
	}

	let a = points[0];
	let b = points[1];
	const c = points[2];

	let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(
		2
	)},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(
		b[1],
		c[1]
	).toFixed(2)} T`;

	for (let i = 2, max = len - 1; i < max; i++) {
		a = points[i];
		b = points[i + 1];
		result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(
			2
		)} `;
	}

	if (closed) {
		result += "Z";
	}

	return result;
}

export default Canvas;
