import { Brush, PaintBucket, Undo2, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";
import {
	changeStrokeColor,
	changeStrokeWidth,
	changeTool,
	CanvasTool,
} from "@/state/features/client";

import { undoStroke, clearStrokes } from "@/state/features/canvas";

export function CanvasTools() {
	const dispatch = useDispatch();
	const tool = useSelector((state: RootState) => state.client.canvas.tool);
	return (
		<div className="flex justify-between w-full ">
			<Colors />
			{/* <StrokeTool /> */}
			<div className="flex gap-2">
				<Strokes />
				<div className="flex flex-col gap-1">
					<ToolButton
						selected={tool === CanvasTool.Brush}
						onClick={() => dispatch(changeTool(CanvasTool.Brush))}
					>
						<Brush className="h-5" />
					</ToolButton>
					<ToolButton
						selected={tool === CanvasTool.Bucket}
						onClick={() => dispatch(changeTool(CanvasTool.Bucket))}
					>
						<PaintBucket className="h-5" />
					</ToolButton>
				</div>
			</div>
			<div className="flex flex-col gap-1">
				<ToolButton onClick={() => dispatch(undoStroke())}>
					<Undo2 className="h-5" />
				</ToolButton>
				<ToolButton onClick={() => dispatch(clearStrokes())}>
					<Trash className="h-5" />
				</ToolButton>
			</div>
		</div>
	);
}

const strokeWidthPresets = [8, 12, 16, 18, 22, 28];
function Strokes() {
	const dispatch = useDispatch();
	const strokeWidth = useSelector(
		(state: RootState) => state.client.canvas.strokeWidth
	);
	const strokeColor = useSelector(
		(state: RootState) => state.client.canvas.strokeColor
	);
	return (
		<div className="grid grid-cols-3 grid-rows-2 gap-1">
			{strokeWidthPresets.map((width) => (
				<Button
					key={width}
					size="icon"
					variant={strokeWidth === width ? "default" : "outline"}
					onClick={() => dispatch(changeStrokeWidth(width))}
				>
					<span
						className="rounded-full cursor-pointer border border-border aspect-square"
						style={{ width: `${width}px`, backgroundColor: strokeColor }}
					/>
				</Button>
			))}
		</div>
	);
}
const colorPresets = [
	// "#000000",
	// "#ffffff",
	// "#ff0000",
	// "#00ff00",
	// "#0000ff",
	// "#ffff00",
	// "#00ffff",
	// "#ff00ff",
	"#000000", // Black
	"#FFFFFF", // White
	"#FF0000", // Red
	"#00FF00", // Lime
	"#0000FF", // Blue
	"#FFFF00", // Yellow
	"#00FFFF", // Cyan
	"#FF00FF", // Magenta
	"#808080", // Gray
	"#800000", // Maroon
	"#808000", // Olive
	"#008000", // Green
	"#800080", // Purple
	"#008080", // Teal
	"#000080", // Navy
	"#FFA500", // Orange
	"#A52A2A", // Brown
	"#FFC0CB", // Pink
	"#FFD700", // Gold
	"#ADFF2F", // Green Yellow
	"#FF69B4", // Hot Pink
	"#1E90FF", // Dodger Blue
	"#F0E68C", // Khaki
	"#8A2BE2", // Blue Violet
];
function Colors() {
	const dispatch = useDispatch();
	return (
		<div className="grid grid-cols-12 gap-1">
			{colorPresets.map((color) => (
				<button
					onClick={() => dispatch(changeStrokeColor(color))}
					key={color}
					className=" w-10 aspect-square rounded-md cursor-pointer border border-border"
					style={{ backgroundColor: color }}
				/>
			))}
		</div>
	);
}

export function ToolButton({
	children,
	selected,
	...props
}: {
	children: React.ReactNode;
	selected?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<Button size="icon" variant={selected ? "default" : "outline"} {...props}>
			{children}
		</Button>
	);
}

export function StrokeTool() {
	const dispatch = useDispatch();

	const strokeColor = useSelector(
		(state: RootState) => state.client.canvas.strokeColor
	);
	const strokeWidth = useSelector(
		(state: RootState) => state.client.canvas.strokeWidth
	);

	const strokeWidthPresets = [2, 4, 8, 12, 16];
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button size="icon" variant="outline">
					<div
						className="rounded-full border border-border aspect-square"
						style={{
							backgroundColor: strokeColor,
							height: `${strokeWidth / 2}px`,
						}}
					></div>
				</Button>
			</PopoverTrigger>
			<PopoverContent sideOffset={12} className=" w-56 p-2 gap-2 flex flex-col">
				<HexColorPicker
					className="max-w-full min-w-full"
					color={strokeColor}
					onChange={(color) => dispatch(changeStrokeColor(color))}
				/>
				<div className="flex flex-wrap justify-between">
					{colorPresets.map((color) => (
						<button
							onClick={() => dispatch(changeStrokeColor(color))}
							key={color}
							className=" basis-[12%] aspect-square rounded-full cursor-pointer border border-border"
							style={{ backgroundColor: color }}
						/>
					))}
				</div>
				<div className="flex gap-2 items-center justify-between px-4">
					{strokeWidthPresets.map((width) => (
						<button
							onClick={() => dispatch(changeStrokeWidth(width))}
							key={width}
							className="rounded-full cursor-pointer border border-border aspect-square"
							style={{
								width: `${width}px`,
								backgroundColor: strokeColor,
							}}
						/>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}

export function CopyRoomLink() {
	const handleCopy = () => {
		const url = window.location.href;
		navigator.clipboard.writeText(url);
		toast.info("Copied to clipboard");
	};

	return (
		<Button variant="outline" onClick={handleCopy}>
			Copy invite link
		</Button>
	);
}
