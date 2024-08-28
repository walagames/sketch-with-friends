import { Brush, PaintBucket, Undo2, Trash, Link } from "lucide-react";
import { Button } from "../ui/button";

export function CanvasTools() {
	const { handleEvent, updateSettings, settings } = useRoomContext();
	return (
		<div className="flex justify-between w-full ">
			<Colors />
			{/* <StrokeTool /> */}
			<div className="flex gap-2">
				<Strokes />
				<div className="flex flex-col gap-1">
					<ToolButton
						selected={settings.tool === Tool.BRUSH}
						onClick={() =>
							updateSettings({
								type: SettingActionType.CHANGE_TOOL,
								payload: Tool.BRUSH,
							})
						}
					>
						<Brush className="h-5" />
					</ToolButton>
					<ToolButton
						selected={settings.tool === Tool.BUCKET}
						onClick={() =>
							updateSettings({
								type: SettingActionType.CHANGE_TOOL,
								payload: Tool.BUCKET,
							})
						}
					>
						<PaintBucket className="h-5" />
					</ToolButton>
				</div>
			</div>
			<div className="flex flex-col gap-1">
				<ToolButton
					onClick={() => handleEvent({ type: RoomEventType.UNDO_STROKE })}
				>
					<Undo2 className="h-5" />
				</ToolButton>
				<ToolButton
					onClick={() => handleEvent({ type: RoomEventType.CLEAR_STROKES })}
				>
					<Trash className="h-5" />
				</ToolButton>
			</div>
		</div>
	);
}

const strokeWidthPresets = [8, 12, 16, 18, 22, 28];
function Strokes() {
	const { settings, updateSettings } = useRoomContext();
	return (
		<div className="grid grid-cols-3 grid-rows-2 gap-1">
			{strokeWidthPresets.map((width) => (
				<Button
					size="icon"
					variant={settings.strokeWidth === width ? "default" : "outline"}
					onClick={() =>
						updateSettings({
							type: SettingActionType.CHANGE_STROKE_WIDTH,
							payload: width,
						})
					}
				>
					<span
						className="rounded-full cursor-pointer border border-border aspect-square"
						style={{ width: `${width}px`, backgroundColor: settings.color }}
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
	const { updateSettings } = useRoomContext();
	return (
		<div className="grid grid-cols-12 gap-1">
			{colorPresets.map((color) => (
				<button
					onClick={() =>
						updateSettings({
							type: SettingActionType.CHANGE_COLOR,
							payload: color,
						})
					}
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

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import { useRoomContext } from "../../contexts/room-context";
import { toast } from "sonner";
import { useRoom } from "@/hooks/use-room";
import { RoomEventType } from "@/types/room";
import { SettingActionType, Tool } from "@/types/canvas";

export function StrokeTool() {
	const { settings, updateSettings } = useRoomContext();

	const strokeWidthPresets = [2, 4, 8, 12, 16];
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button size="icon" variant="outline">
					<div
						className="rounded-full border border-border aspect-square"
						style={{
							backgroundColor: settings.color,
							height: `${settings.strokeWidth / 2}px`,
						}}
					></div>
				</Button>
			</PopoverTrigger>
			<PopoverContent sideOffset={12} className=" w-56 p-2 gap-2 flex flex-col">
				<HexColorPicker
					className="max-w-full min-w-full"
					color={settings.color}
					onChange={(color) =>
						updateSettings({
							type: SettingActionType.CHANGE_COLOR,
							payload: color,
						})
					}
				/>
				<div className="flex flex-wrap justify-between">
					{colorPresets.map((color) => (
						<button
							onClick={() =>
								updateSettings({
									type: SettingActionType.CHANGE_COLOR,
									payload: color,
								})
							}
							key={color}
							className=" basis-[12%] aspect-square rounded-full cursor-pointer border border-border"
							style={{ backgroundColor: color }}
						/>
					))}
				</div>
				<div className="flex gap-2 items-center justify-between px-4">
					{strokeWidthPresets.map((width) => (
						<button
							onClick={() =>
								updateSettings({
									type: SettingActionType.CHANGE_STROKE_WIDTH,
									payload: width,
								})
							}
							key={width}
							className="rounded-full cursor-pointer border border-border aspect-square"
							style={{
								width: `${width}px`,
								backgroundColor: settings.color,
							}}
						/>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}

export function CopyRoomLink() {
	const { room } = useRoomContext();

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
