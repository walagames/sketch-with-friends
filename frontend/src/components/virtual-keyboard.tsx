import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RaisedButton } from "./ui/raised-button";
import { RaisedInput } from "./ui/raised-input";
import { cn } from "@/lib/utils";
import { fileURLToPath } from "url";

const keys = [
	["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
	["a", "s", "d", "f", "g", "h", "j", "k", "l"],
	["z", "x", "c", "v", "b", "n", "m", "."],
];

export function VirtualKeyboardComponent({
	setInput,
	className,
	placeholder,
	field,
	value: initialValue,
	onSubmit,
}: {
	setInput: (value: string | ((prev: string) => string)) => void;
	className?: string;
	placeholder?: string;
	field: any;
	value: string;
	onSubmit: () => void;
}) {
	const [isUpperCase, setIsUpperCase] = useState(false);
	const [showKeyboard, setShowKeyboard] = useState(false);
	const [isFocused, setIsFocused] = useState(false);
	const fakeInputRef = useRef<HTMLDivElement>(null);
	const keyboardRef = useRef<HTMLDivElement>(null);

	const handleKeyPress = (key: string) => {
		const newKey = isUpperCase ? key.toUpperCase() : key;
		setInput((prev) => prev + newKey);
	};

	const handleBackspace = () => {
		setInput((prev) => prev.slice(0, -1));
	};

	const handleSpace = () => {
		setInput((prev) => prev + " ");
	};

	const toggleCase = () => {
		setIsUpperCase((prev) => !prev);
	};

	const scrollToEnd = () => {
		if (fakeInputRef.current) {
			fakeInputRef.current.scrollLeft = fakeInputRef.current.scrollWidth;
		}
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				fakeInputRef.current &&
				!fakeInputRef.current.contains(event.target as Node) &&
				keyboardRef.current &&
				!keyboardRef.current.contains(event.target as Node)
			) {
				setShowKeyboard(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	useEffect(() => {
		if (isFocused && fakeInputRef.current) {
			fakeInputRef.current.scrollLeft = fakeInputRef.current.scrollWidth;
		}
	}, [initialValue, isFocused]);

	return (
		<div className={cn("flex-1 bg-white rounded-lg shadow-accent", className)}>
			<div className="relative w-full">
				<div className="relative w-full ">
					<div
						ref={fakeInputRef}
						role="textbox"
						tabIndex={0}
						onClick={() => {
							setShowKeyboard(true);
							setIsFocused(true);
						}}
						onBlur={() => setIsFocused(false)}
						className={cn(
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-[calc(100vw-2rem)] overflow-hidden",
							"border border-input bg-background px-3 py-2 rounded-md",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							{
								"after:content-['|'] after:ml-[1px] after:animate-blink": isFocused,
							}
						)}
						style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
						aria-label="Virtual keyboard input"
					>
						{initialValue || (
							<span className="text-foreground-muted">
								{placeholder || "Tap to start typing..."}
							</span>
						)}
					</div>
				</div>
			</div>
			{showKeyboard && (
				<div ref={keyboardRef} className="grid gap-1.5 p-2 py-4  w-full">
					{keys.map((row, rowIndex) => (
						<div key={rowIndex} className="flex justify-center gap-1">
							{rowIndex === 2 && (
								<RaisedButton
									onClick={toggleCase}
									className="w-10 h-10 text-sm font-semibold virtual-keyboard-button touch-none"
									size="sm"
									variant="action"
									aria-pressed={isUpperCase}
									aria-label={
										isUpperCase ? "Switch to lowercase" : "Switch to uppercase"
									}
								>
									⇧
								</RaisedButton>
							)}
							{row.map((key) => (
								<RaisedButton
									key={key}
									onMouseDown={(e) => {
										e.preventDefault();
										handleKeyPress(key);
									}}
									className="w-[1.95rem] h-10 text-sm font-semibold virtual-keyboard-button touch-none"
									size="sm"
									variant="action"
								>
									{isUpperCase ? key.toUpperCase() : key}
								</RaisedButton>
							))}
						</div>
					))}
					<div className="flex justify-center gap-1.5 mt-1">
						<RaisedButton
							size="wide"
							onMouseDown={(e) => {
								e.preventDefault();
								handleSpace();
							}}
							variant="action"
							className="h-10 text-sm font-semibold virtual-keyboard-button touch-none"
						>
							Space
						</RaisedButton>
						<RaisedButton
							onMouseDown={(e) => {
								e.preventDefault();
								handleBackspace();
							}}
							variant="action"
							className="w-10 h-10 text-sm font-semibold virtual-keyboard-button touch-none"
							aria-label="Backspace"
						>
							⌫
						</RaisedButton>
						<RaisedButton
							onMouseDown={(e) => {
								e.preventDefault();
								onSubmit();
							}}
							variant="action"
							className="w-10 h-10 text-sm font-semibold virtual-keyboard-button touch-none"
							aria-label="Submit"
						>
							↵
						</RaisedButton>
					</div>
				</div>
			)}
		</div>
	);
}
