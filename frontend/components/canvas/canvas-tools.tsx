import { Brush, PaintBucket, Undo2, Trash, Link } from "lucide-react";
import { Button } from "../ui/button";

export function CanvasTools() {
	const { handleEvent, updateSettings, settings } = useRoomContext();
	return (
		<div className="absolute bottom-5 left-1/2 p-1 bg-white rounded-lg shadow-lg border border-border -translate-x-1/2 flex items-center gap-1">
			<StrokeTool />
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
import { useRoomContext } from "../room/room-provider";
import { toast } from "sonner";
import { useRoom } from "@/hooks/use-room";
import { RoomEventType } from "@/types/room";
import { SettingActionType, Tool } from "@/types/canvas";

export function StrokeTool() {
	const { settings, updateSettings } = useRoomContext();
	const colorPresets = [
		"#000000",
		"#ffffff",
		"#ff0000",
		"#00ff00",
		"#0000ff",
		"#ffff00",
		"#00ffff",
		"#ff00ff",
	];
	const strokeWidthPresets = [8, 16, 24, 32, 40];
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
								width: `${width * 2}px`,
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
		const url = window.location.href + "?room=" + room.code;
		navigator.clipboard.writeText(url);
		toast.info("Copied to clipboard");
	};

	return (
		<ToolButton onClick={handleCopy}>
			<Link className="h-5" />
		</ToolButton>
	);
}
