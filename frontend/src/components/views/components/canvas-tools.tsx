import { Brush, Undo2, Trash, Eraser, PaintBucket } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { Slider } from "../../ui/slider";
import { HexColorPicker } from "react-colorful";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { PalleteIcon } from "@/components/ui/icons";

import {
	changeStrokeWidth,
	changeTool,
	CanvasTool,
	changeHue,
	changeLightness,
	changeColor,
} from "@/state/features/client";

import { undoStroke, clearStrokes } from "@/state/features/canvas";
import { RaisedButton } from "../../ui/raised-button";
import { getGameRole } from "@/lib/player";
import { GameRole } from "@/state/features/game";
import { cn, hslToRgb } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { containerSpring } from "@/config/spring";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CanvasTools() {
	const dispatch = useDispatch();
	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.room.playerId);
	const role = getGameRole(playerId, players);

	const [colorPaletteOpen, setColorPaletteOpen] = useState(false);

	const isDrawing = role === GameRole.Drawing;

	const currentTool = useSelector(
		(state: RootState) => state.client.canvas.tool
	);

	const timerEndsAt = useSelector((state: RootState) => state.room.timerEndsAt);

	const isRoundActive = useMemo(
		() => new Date(timerEndsAt) > new Date(),
		[timerEndsAt]
	);

	// Add keyboard shortcut handling
	useEffect(() => {
		if (!isDrawing) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Ignore if user is typing in an input
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			switch (e.key.toLowerCase()) {
				case "b":
					dispatch(changeTool(CanvasTool.Brush));
					break;
				case "f":
					dispatch(changeTool(CanvasTool.Bucket));
					break;
				case "e":
					dispatch(changeTool(CanvasTool.Eraser));
					break;
				case "p":
					setColorPaletteOpen(true);
					break;
				case "z":
					if ((e.metaKey || e.ctrlKey) && isRoundActive) {
						dispatch(undoStroke());
					}
					break;
				case "c":
					if ((e.metaKey || e.ctrlKey) && isRoundActive) {
						dispatch(clearStrokes());
					}
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [dispatch, isDrawing, isRoundActive]);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ ...containerSpring, delay: 1.5 }}
			className={cn(
				"lg:gap-8 gap-4 w-full items-center py-1.5 lg:py-4 px-3.5 lg:px-0 max-w-[800px] ",
				isDrawing ? "flex" : "hidden"
			)}
		>
			<StrokeWidthSlider />
			<div className="flex gap-2">
				<div className="gap-2 hidden lg:flex">
					<RaisedButton
						size="icon"
						variant={currentTool === CanvasTool.Brush ? "action" : "basic"}
						shift={false}
						onClick={() => dispatch(changeTool(CanvasTool.Brush))}
						shortcut="B"
					>
						<Brush className="size-5" />
					</RaisedButton>
					<RaisedButton
						size="icon"
						variant={currentTool === CanvasTool.Bucket ? "action" : "basic"}
						shift={false}
						onClick={() => dispatch(changeTool(CanvasTool.Bucket))}
						shortcut="F"
					>
						<PaintBucket className="size-5" />
					</RaisedButton>
					<RaisedButton
						size="icon"
						variant={currentTool === CanvasTool.Eraser ? "action" : "basic"}
						shift={false}
						onClick={() => dispatch(changeTool(CanvasTool.Eraser))}
						shortcut="E"
					>
						<Eraser className="size-5" />
					</RaisedButton>
				</div>
				<div className="lg:hidden">
					<ToolDropdown />
				</div>
				<ColorPaletteDialog
					isOpen={colorPaletteOpen}
					setIsOpen={setColorPaletteOpen}
				/>
			</div>
			<div className="flex gap-2">
				<RaisedButton
					disabled={!isRoundActive}
					shift={false}
					size="icon"
					onClick={() => dispatch(undoStroke())}
					shortcut="⌘Z"
				>
					<Undo2 className="size-5" />
				</RaisedButton>
				<RaisedButton
					disabled={!isRoundActive}
					shift={false}
					size="icon"
					onClick={() => dispatch(clearStrokes())}
					shortcut="⌘C"
				>
					<Trash className="size-5" />
				</RaisedButton>
			</div>
		</motion.div>
	);
}

function getToolIcon(tool: CanvasTool) {
	switch (tool) {
		case CanvasTool.Brush:
			return <Brush className="size-5" />;
		case CanvasTool.Bucket:
			return <PaintBucket className="size-5" />;
		default:
			return <Eraser className="size-5" />;
	}
}

function ToolDropdown() {
	const currentTool = useSelector(
		(state: RootState) => state.client.canvas.tool
	);
	const dispatch = useDispatch();
	const [toolSelectOpen, setToolSelectOpen] = useState(false);
	return (
		<DropdownMenu open={toolSelectOpen} onOpenChange={setToolSelectOpen}>
			<DropdownMenuTrigger asChild>
				<RaisedButton size="icon" variant="action" shift={false}>
					{getToolIcon(currentTool as CanvasTool)}
				</RaisedButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				side="top"
				sideOffset={10}
				className="flex gap-3 p-3 bg-background-secondary"
			>
				<RaisedButton
					size="icon"
					variant={currentTool === CanvasTool.Brush ? "action" : "basic"}
					shift={false}
					onClick={() => {
						dispatch(changeTool(CanvasTool.Brush));
						setToolSelectOpen(false);
					}}
				>
					<Brush className="size-5" />
				</RaisedButton>
				<RaisedButton
					size="icon"
					variant={currentTool === CanvasTool.Bucket ? "action" : "basic"}
					shift={false}
					onClick={() => {
						dispatch(changeTool(CanvasTool.Bucket));
						setToolSelectOpen(false);
					}}
				>
					<PaintBucket className="size-5" />
				</RaisedButton>
				<RaisedButton
					size="icon"
					variant={currentTool === CanvasTool.Eraser ? "action" : "basic"}
					shift={false}
					onClick={() => {
						dispatch(changeTool(CanvasTool.Eraser));
						setToolSelectOpen(false);
					}}
				>
					<Eraser className="size-5" />
				</RaisedButton>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

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

function ColorPaletteDialog({
	isOpen,
	setIsOpen,
}: {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
}) {
	const currentColor = useSelector(
		(state: RootState) => state.client.canvas.color
	);
	const recentlyUsedColors = useSelector(
		(state: RootState) => state.client.canvas.recentlyUsedColors
	);
	const dispatch = useDispatch();
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<RaisedButton
					size="icon"
					variant={currentColor === "#ffffff" ? "action" : "basic"}
					shift={false}
					shortcut="P"
				>
					<div className="h-11 w-11 rounded-lg flex items-center justify-center">
						<PalleteIcon className="size-5" />
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
	);
}

function StrokeWidthSlider() {
	const strokeWidth = useSelector(
		(state: RootState) => state.client.canvas.strokeWidth
	);
	const currentColor = useSelector(
		(state: RootState) => state.client.canvas.color
	);
	const dispatch = useDispatch();

	const handleStrokeWidthChange = (value: number[]) => {
		dispatch(changeStrokeWidth(value[0]));
	};
	return (
		<Dialog>
			<div className="flex items-center w-full relative max-w-sm">
				<div className="rounded-full border-[4px] border-border w-7 bg-background aspect-square -mr-1 relative z-10" />
				<Slider
					trackStyles={{
						borderRadius: "0px",
					}}
					min={1}
					max={50}
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
	const hue = useSelector((state: RootState) => state.client.canvas.hue);
	const lightness = useSelector(
		(state: RootState) => state.client.canvas.lightness
	);
	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.room.playerId);

	const role = getGameRole(playerId, players);
	const isDrawing = role === GameRole.Drawing;

	const dispatch = useDispatch();

	const handleHueChange = (value: number[]) => {
		dispatch(changeHue(value[0]));
	};

	const handleLightnessChange = (value: number[]) => {
		dispatch(changeLightness(value[0]));
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
