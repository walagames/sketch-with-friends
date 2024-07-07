import { useState } from "react";
import { Brush, PaintBucket, Undo2, Trash, Link } from "lucide-react";
import { Button } from "../ui/button";

export function CanvasTools({
	color,
	setColor,
	width,
	setWidth,
}: {
	color: string;
	setColor: (color: string) => void;
	width: number;
	setWidth: (width: number) => void;
}) {
	return (
		<div className="absolute bottom-5 left-1/2 p-1 bg-white rounded-lg shadow-lg border border-border -translate-x-1/2 flex items-center gap-1">
			<StrokeTool
				color={color}
				setColor={setColor}
				width={width}
				setWidth={setWidth}
			/>
			<ToolButton>
				<Brush className="h-5" />
			</ToolButton>
			<ToolButton>
				<PaintBucket className="h-5" />
			</ToolButton>
			<ToolButton>
				<Undo2 className="h-5" />
			</ToolButton>
			<ToolButton>
				<Trash className="h-5" />
			</ToolButton>
		</div>
	);
}

export function ToolButton({
	children,
	...props
}: {
	children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<Button size="icon" variant="outline" {...props}>
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

export function StrokeTool({
	color,
	setColor,
	width,
	setWidth,
}: {
	color: string;
	setColor: (color: string) => void;
	width: number;
	setWidth: (width: number) => void;
}) {
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
						style={{ backgroundColor: color, height: `${width / 2}px` }}
					></div>
				</Button>
			</PopoverTrigger>
			<PopoverContent sideOffset={12} className=" w-56 p-2 gap-2 flex flex-col">
				<HexColorPicker
					className="max-w-full min-w-full"
					color={color}
					onChange={setColor}
				/>
				<div className="flex flex-wrap justify-between">
					{colorPresets.map((color) => (
						<button
							onClick={() => setColor(color)}
							key={color}
							className=" basis-[12%] aspect-square rounded-full cursor-pointer border border-border"
							style={{ backgroundColor: color }}
						/>
					))}
				</div>
				<div className="flex gap-2 items-center justify-between px-4">
					{strokeWidthPresets.map((width) => (
						<button
							onClick={() => setWidth(width)}
							key={width}
							className="rounded-full cursor-pointer border border-border aspect-square"
							style={{
								width: `${width * 2}px`,
								backgroundColor: color,
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
