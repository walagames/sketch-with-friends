import { Brush, PaintBucket, Undo2, Trash } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { Slider } from "./ui/slider";
import {
	changeStrokeWidth,
	changeTool,
	CanvasTool,
	changeHue,
	changeLightness,
} from "@/state/features/client";

import { undoStroke, clearStrokes } from "@/state/features/canvas";
import { RaisedButton } from "./ui/raised-button";

export function CanvasTools() {
	const dispatch = useDispatch();
	const tool = useSelector((state: RootState) => state.client.canvas.tool);
	return (
		<div className="flex lg:gap-8 gap-4 w-full items-center pt-2 lg:py-4 px-3.5 lg:px-0 ">
			<StrokeWidthSlider />
			<div className="flex gap-2">
				<RaisedButton
					size="icon"
					shift={false}
					variant={tool === CanvasTool.Brush ? "action" : "default"}
					onClick={() => dispatch(changeTool(CanvasTool.Brush))}
				>
					<Brush className="lg:size-6 size-5" />
				</RaisedButton>
				<RaisedButton
					size="icon"
					shift={false}
					variant={tool === CanvasTool.Bucket ? "action" : "default"}
					onClick={() => dispatch(changeTool(CanvasTool.Bucket))}
				>
					<PaintBucket />
				</RaisedButton>
				{/* <RaisedButton
					size="icon"
					shift={false}
					variant={tool === CanvasTool.Eraser ? "action" : "default"}
					onClick={() => dispatch(changeTool(CanvasTool.Eraser))}
				>
					<EraserIcon />
				</RaisedButton> */}
			</div>
			<div className="flex gap-2">
				<RaisedButton
					shift={false}
					size="icon"
					onClick={() => dispatch(undoStroke())}
				>
					<Undo2 className="lg:size-6 size-5" />
				</RaisedButton>
				<RaisedButton
					shift={false}
					size="icon"
					onClick={() => dispatch(clearStrokes())}
				>
					<Trash className="lg:size-6 size-5" />
				</RaisedButton>
			</div>
		</div>
	);
}

function StrokeWidthSlider() {
	const dispatch = useDispatch();
	const strokeWidth = useSelector(
		(state: RootState) => state.client.canvas.strokeWidth
	);

	const handleStrokeWidthChange = (value: number[]) => {
		dispatch(changeStrokeWidth(value[0]));
	};

	return (
		<div className="flex items-center w-full relative max-w-sm">
			<div className="rounded-full border-[4px] border-border w-7 bg-background aspect-square -mr-1 relative z-10" />
			<Slider
				trackStyles={{
					borderRadius: "0px",
				}}
				min={6}
				max={60}
				step={1}
				value={[strokeWidth]}
				onValueChange={handleStrokeWidthChange}
				className="w-full"
			/>
			<div className="rounded-full border-[6px] border-border lg:w-14 w-12 bg-background aspect-square -ml-1 relative z-10" />
		</div>
	);
}

export function ColorSliders() {
	const dispatch = useDispatch();
	const hue = useSelector((state: RootState) => state.client.canvas.hue);
	const lightness = useSelector(
		(state: RootState) => state.client.canvas.lightness
	);

	const handleHueChange = (value: number[]) => {
		dispatch(changeHue(value[0]));
	};

	const handleLightnessChange = (value: number[]) => {
		dispatch(changeLightness(value[0]));
	};

	const hslToRgb = (h: number, s: number, l: number) => {
		h /= 360;
		s /= 100;
		l /= 100;
		let r, g, b;

		if (s === 0) {
			r = g = b = l; // achromatic
		} else {
			const hue2rgb = (p: number, q: number, t: number) => {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1 / 6) return p + (q - p) * 6 * t;
				if (t < 1 / 2) return q;
				if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
				return p;
			};

			const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			r = hue2rgb(p, q, h + 1 / 3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1 / 3);
		}

		return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
			b * 255
		)})`;
	};

	return (
		<div className="flex gap-6 w-full max-w-sm">
			<div className="flex items-center  relative h-96">
				<Slider
					orientation="vertical"
					min={0}
					max={100}
					step={1}
					value={[lightness]}
					onValueChange={handleLightnessChange}
					className="h-full"
					thumbStyles={{
						backgroundColor: hslToRgb(hue, 100, lightness),
					}}
					trackStyles={{
						background: `linear-gradient(to top, #000000, ${hslToRgb(
							hue,
							100,
							50
						)}, #ffffff)`,
					}}
				/>
			</div>
			<div className="flex items-center h-96 relative">
				<Slider
					trackStyles={{
						background:
							"linear-gradient(to top, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
					}}
					thumbStyles={{
						backgroundColor: hslToRgb(hue, 100, 50),
					}}
					orientation="vertical"
					min={0}
					max={360}
					step={1}
					value={[hue]}
					onValueChange={handleHueChange}
					className="h-full"
				/>
			</div>
		</div>
	);
}
