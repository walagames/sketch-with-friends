import * as React from "react";
import { getStroke } from "perfect-freehand";
import { useRoomContext } from "./room-provider";
import { PlayerAction } from "@/lib/types";

const options = {
	size: 18,
	thinning: 0.5,
	smoothing: 0.5,
	streamline: 0.5,
	easing: (t) => t,
	start: {
		taper: 0,
		easing: (t) => t,
		cap: true,
	},
	end: {
		taper: 100,
		easing: (t) => t,
		cap: true,
	},
};

function Canvas() {
	const { sendEvent, state, handleStrokeStart, handleStroke } = useRoomContext();
	const canvasRef = React.useRef(null);
	// const [points, setPoints] = React.useState([]);
	const [context, setContext] = React.useState(null);
	React.useEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			const ctx: CanvasRenderingContext2D = canvas.getContext("2d");
			setContext(ctx);
			// ctx.lineWidth = 5;
			// ctx.lineCap = "round";
			// ctx.lineJoin = "round";
			// ctx.strokeStyle = "black";
		}
	}, []);

	React.useEffect(() => {
		console.log("runs");
		const stroke = getStroke(state.points, options);
		const pathData = getSvgPathFromStroke(stroke);
		const myPath = new Path2D(pathData);
		if (context) {
			context.fill(myPath);
		}
	}, [state.points]);

	// React.useEffect(() => {
	// 	const stroke = getStroke(state$.points.get(), options);
	// 	const pathData = getSvgPathFromStroke(stroke);
	// 	const myPath = new Path2D(pathData);
	// 	if (context) {
	// 		context.fill(myPath);
	// 	}
	// 	// console.log(points);
	// }, [state$.points.get()]);

	function handlePointerDown(e) {
		e.target.setPointerCapture(e.pointerId);
		handleStrokeStart([e.pageX * 2, e.pageY * 2]);
		sendEvent(PlayerAction.STROKE, [e.pageX * 2, e.pageY * 2]);
	}

	function handlePointerMove(e) {
		if (e.buttons !== 1) return;
		handleStroke([e.pageX * 2, e.pageY * 2]);
		sendEvent(PlayerAction.STROKE, [e.pageX * 2, e.pageY * 2]);
	}

	return (
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
		></canvas>
	);
}

const average = (a, b) => (a + b) / 2;

export function getSvgPathFromStroke(points, closed = true) {
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
