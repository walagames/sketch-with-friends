import { Brush, Undo2, Trash, Paintbrush2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { Slider } from "../../../ui/slider";
import { HexColorPicker } from "react-colorful";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	changeStrokeWidth,
	changeTool,
	CanvasTool,
	changeHue,
	changeLightness,
	changeColor,
} from "@/state/features/client";

import { undoStroke, clearStrokes } from "@/state/features/canvas";
import { RaisedButton } from "../../../ui/raised-button";
import { getGameRole } from "@/lib/player";
import { GameRole } from "@/state/features/game";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import { containerSpring } from "@/config/spring";
const swatches = [
	// Monochrome
	"#ffffff", // white
	"#c1c1c1", // light gray
	"#505050", // dark gray
	"#000000", // black

	// Reds
	"#ef130b", // bright red
	"#740b07", // dark red

	// Oranges
	"#ff7100", // bright orange
	"#c23800", // dark orange

	// Yellows
	"#ffe400", // bright yellow
	"#e8a200", // dark yellow

	// Greens
	"#00cc00", // bright green
	"#00785d", // dark green

	// Blues
	"#00b2ff", // bright blue
	"#00569e", // dark blue

	// Purple/Indigo
	"#231fd3", // bright indigo
	"#0e0865", // dark indigo

	// Purples/Magentas
	"#a300ba", // bright purple
	"#550069", // dark purple

	// Pinks
	"#df69a7", // bright pink
	"#873554", // dark pink

	// Peach/Skin tones
	"#ffac8e", // light peach
	"#cc774d", // dark peach

	// Browns
	"#a0522d", // light brown
	"#63300d", // dark brown
];

function PalleteIcon({
	className,
	style,
}: {
	className?: string;
	style?: React.CSSProperties;
}) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={cn("", className)}
			style={style}
		>
			<circle
				cx="13.5"
				cy="6.5"
				r=".5"
				fill="currentColor"
				className="text-green-500"
			/>
			<circle
				cx="17.5"
				cy="10.5"
				r=".5"
				fill="currentColor"
				className="text-blue-500"
			/>
			<circle
				cx="8.5"
				cy="7.5"
				r=".5"
				fill="currentColor"
				className="text-orange-500"
			/>
			<circle
				cx="6.5"
				cy="12.5"
				r=".5"
				fill="currentColor"
				className="text-red-500"
			/>
			<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
		</svg>
	);
}

export function CanvasTools() {
	const dispatch = useDispatch();
	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.client.id);
	const role = getGameRole(playerId, players);

	const isDrawing = role === GameRole.Drawing;

	const currentColor = useSelector(
		(state: RootState) => state.client.canvas.color
	);
	const currentTool = useSelector(
		(state: RootState) => state.client.canvas.tool
	);
	const recentlyUsedColors = useSelector(
		(state: RootState) => state.client.canvas.recentlyUsedColors
	);

	const [isOpen, setIsOpen] = useState(false);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ ...containerSpring, delay: 1.5 }}
			className={cn(
				"lg:gap-8 gap-4 w-full items-center py-1.5 lg:py-4 px-3.5 lg:px-0 ",
				isDrawing ? "flex" : "hidden"
			)}
		>
			<StrokeWidthSlider />
			<div className="flex gap-2">
				<RaisedButton
					size="icon"
					variant={currentTool === CanvasTool.Brush ? "action" : "basic"}
					shift={false}
					onClick={() => dispatch(changeTool(CanvasTool.Brush))}
				>
					<Brush className="lg:size-6 size-5" />
				</RaisedButton>
				<RaisedButton
					size="icon"
					variant={currentTool === CanvasTool.Bucket ? "action" : "basic"}
					shift={false}
					onClick={() => dispatch(changeTool(CanvasTool.Bucket))}
				>
					<Paintbrush2 className="lg:size-6 size-5" />
				</RaisedButton>
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogTrigger asChild>
						<RaisedButton
							size="icon"
							variant={currentColor === "#ffffff" ? "action" : "basic"}
							shift={false}
						>
							<div className="h-11 w-11 rounded-lg flex items-center justify-center">
								<PalleteIcon className="size-5 lg:size-7" />
							</div>
						</RaisedButton>
					</DialogTrigger>
					<DialogContent className="sm:max-w-md border-4 border-foreground bg-zinc-100">
						<DialogTitle>
							<p className="text-lg font-semibold">Color palette</p>
						</DialogTitle>
						<div className="flex flex-col gap-8">
							<div className="flex gap-6">
								<HexColorPicker
									className="custom-pointers shadow-accent rounded-lg"
									color={currentColor}
									onChange={(color) => dispatch(changeColor(color))}
								/>
								<div className="flex flex-col gap-2">
									{recentlyUsedColors.length > 0 && (
										<p className="text-sm font-semibold">Recently used:</p>
									)}
									<div className="grid grid-cols-3 gap-2.5">
										{recentlyUsedColors.map((color) => (
											<RaisedButton
												key={color}
												size="icon"
												onClick={() => {
													dispatch(changeColor(color));
													setIsOpen(false);
												}}
												className="overflow-hidden w-full aspect-square"
											>
												<div
													style={{
														backgroundColor: color,
													}}
													className="h-20 w-20 rounded-lg flex items-center justify-center"
												/>
											</RaisedButton>
										))}
									</div>
								</div>
							</div>
							<div className="grid grid-cols-8 gap-2 w-full">
								{swatches.map((swatch) => (
									<RaisedButton
										key={swatch}
										size="icon"
										onClick={() => {
											dispatch(changeColor(swatch));
											setIsOpen(false);
										}}
										className="overflow-hidden w-full aspect-square"
									>
										<div
											style={{ backgroundColor: swatch }}
											className="h-11 w-11 -translate-y-0.5 rounded-lg flex items-center justify-center"
										/>
									</RaisedButton>
								))}
							</div>
						</div>
					</DialogContent>
				</Dialog>
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
		</motion.div>
	);
}

function StrokeWidthSlider() {
	const strokeWidth = useSelector(
		(state: RootState) => state.client.canvas.strokeWidth
	);

	const handleStrokeWidthChange = (value: number[]) => {
		dispatch(changeStrokeWidth(value[0]));
	};

	const dispatch = useDispatch();

	const currentColor = useSelector(
		(state: RootState) => state.client.canvas.color
	);

	return (
		<Dialog>
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

				<DialogContent className="sm:max-w-md">
					<HexColorPicker
						className="custom-pointers"
						color={currentColor}
						onChange={(color) => dispatch(changeColor(color))}
					/>
				</DialogContent>
			</div>
		</Dialog>
	);
}

export function ColorSliders() {
	const dispatch = useDispatch();
	const hue = useSelector((state: RootState) => state.client.canvas.hue);
	const lightness = useSelector(
		(state: RootState) => state.client.canvas.lightness
	);

	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.client.id);
	const role = getGameRole(playerId, players);

	const isDrawing = role === GameRole.Drawing;

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
		<motion.div
			initial={{ opacity: 0, x: -10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ ...containerSpring, delay: 1.5 }}
			className={cn(
				"gap-6 w-full max-w-sm mt-auto py-24",
				isDrawing ? "lg:flex hidden" : "hidden"
			)}
		>
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
							"linear-gradient(to top, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080, #ff0000)",
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
		</motion.div>
	);
}
