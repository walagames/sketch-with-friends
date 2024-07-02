import { useState } from "react";
import { Brush, PaintBucket, Undo2, Trash } from "lucide-react";
import { Button } from "../ui/button";

export function CanvasTools() {
	return (
		<div className="absolute bottom-5 left-1/2 p-1 bg-white rounded-lg shadow-lg border border-border -translate-x-1/2 flex items-center gap-1">
			<StrokeTool />
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

export function ToolButton({ children }: { children: React.ReactNode }) {
	return (
		<Button size="icon" variant="outline">
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

export function StrokeTool() {
	const [color, setColor] = useState("#aabbcc");
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
	const [strokeWidth, setStrokeWidth] = useState(10);
	const strokeWidthPresets = [4, 6, 8, 10, 12, 14, 16];
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button size="icon" variant="outline">
					<div
						className="rounded-full border border-border aspect-square"
						style={{ backgroundColor: color, height: `${strokeWidth * 2}px` }}
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
							onClick={() => setStrokeWidth(width)}
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
