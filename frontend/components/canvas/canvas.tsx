"use client";
import * as React from "react";
import { getStroke } from "perfect-freehand";
import { useRoomContext } from "../room/room-provider";
import { RoomEventType } from "@/types/room";

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
import { CopyRoomLink, ToolButton } from "./canvas-tools";
import { CanvasTools } from "./canvas-tools";
import { useResize } from "@/hooks/use-resize";

function Canvas() {
	const { dispatchEvent, room } = useRoomContext();
	const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
	const containerRef = React.useRef<HTMLDivElement | null>(null);
	const [context, setContext] = React.useState<CanvasRenderingContext2D | null>(
		null
	);
	useResize(canvasRef, containerRef, draw);
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
			const stroke = getStroke(
				room.strokes[room.strokes.length - 1].points,
				options
			);
			const pathData = getSvgPathFromStroke(stroke);
			const myPath = new Path2D(pathData);
			context.fill(myPath);
		}
	}

	React.useEffect(() => {
		if (context) {
			draw();
		}
	}, [room.strokes]);


	function handlePointerDown(e: React.MouseEvent<HTMLCanvasElement>) {
		dispatchEvent({
			type: RoomEventType.NEW_STROKE,
			payload: {
				color: "#FFFFFF",
				width: 8,
				points: [[e.pageX * 2, e.pageY * 2]],
			},
		});
	}

	function handlePointerMove(e: React.MouseEvent<HTMLCanvasElement>) {
		if (e.buttons !== 1) return;

		dispatchEvent({
			type: RoomEventType.STROKE_POINT,
			payload: [e.pageX * 2, e.pageY * 2],
		});
	}

	return (
		<div
			ref={containerRef}
			className="w-screen h-screen relative overflow-hidden"
		>
			<div className="absolute top-3 right-3">
				<CopyRoomLink />
			</div>

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
			<CanvasTools />
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
