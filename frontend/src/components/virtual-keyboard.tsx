import { useState, useRef, useEffect, useCallback } from "react";
import { RaisedButton } from "./ui/raised-button";
import { cn } from "@/lib/utils";
import { useDispatch } from "react-redux";
import { ArrowBigUpIcon, DeleteIcon, SendIcon } from "lucide-react";

const keys = [
	["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
	["a", "s", "d", "f", "g", "h", "j", "k", "l"],
	["z", "x", "c", "v", "b", "n", "m"],
];

export function VirtualKeyboardComponent({
	className,
}: {
	className?: string;
}) {
	const [isUpperCase, setIsUpperCase] = useState(false);
	const [showKeyboard, setShowKeyboard] = useState(false);
	const [input, setInput] = useState("");
	const inputBufferRef = useRef(input);
	const fakeInputRef = useRef<HTMLDivElement>(null);
	const keyboardRef = useRef<HTMLDivElement>(null);

	const dispatch = useDispatch();

	useEffect(() => {
		inputBufferRef.current = input;
	}, [input]);

	const handleKeyPress = useCallback(
		(key: string) => {
			const newKey = isUpperCase ? key.toUpperCase() : key;
			// Update the ref immediately
			inputBufferRef.current += newKey;
			// Then schedule the state update
			requestAnimationFrame(() => {
				setInput(inputBufferRef.current);
			});
		},
		[isUpperCase]
	);

	const handleBackspace = useCallback(() => {
		inputBufferRef.current = inputBufferRef.current.slice(0, -1);
		requestAnimationFrame(() => {
			setInput(inputBufferRef.current);
		});
	}, []);

	const handleSpace = useCallback(() => {
		inputBufferRef.current += " ";
		requestAnimationFrame(() => {
			setInput(inputBufferRef.current);
		});
	}, []);

	const toggleCase = () => {
		setIsUpperCase((prev) => !prev);
	};

	const handleSubmit = useCallback(() => {
		const trimmedGuess = inputBufferRef.current.trim();
		if (trimmedGuess) {
			dispatch({ type: "game/submitGuess", payload: trimmedGuess });
			inputBufferRef.current = "";
			setInput("");
		}
	}, [dispatch]);

	const handleShowKeyboard = () => {
		setShowKeyboard(true);
		if (fakeInputRef.current) {
			fakeInputRef.current.focus();
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

	return (
		<div className={cn("flex-1 bg-white rounded-lg", className)}>
			<FakeInput
				value={input}
				showKeyboard={showKeyboard}
				handleShowKeyboard={handleShowKeyboard}
				fakeInputRef={fakeInputRef}
				isOpen={showKeyboard}
			/>
			{showKeyboard && (
				<div ref={keyboardRef} className="flex flex-col w-full gap-1.5">
					<div className="flex flex-col gap-1.5">
						{keys.map((row, rowIndex) => (
							<div
								style={{
									display: "grid",
									gridAutoFlow: "column",
									gridAutoColumns: "1fr",
								}}
								className="gap-1.5 px-1.5"
								key={rowIndex}
							>
								{rowIndex === 2 && (
									<RaisedButton
										offset="small"
										variant="action"
										size="wide"
										onTouchStart={toggleCase}
										className="font-semibold select-none"
										aria-pressed={isUpperCase}
										aria-label={
											isUpperCase
												? "Switch to lowercase"
												: "Switch to uppercase"
										}
									>
										<ArrowBigUpIcon className="size-6" />
									</RaisedButton>
								)}
								{row.map((key) => (
									<RaisedButton
										offset="small"
										variant="action"
										size="wide"
										key={key}
										onPointerDown={(e) => {
											if (e.pointerType === "touch") {
												// Prevent any touch delays
												e.preventDefault();
												e.stopPropagation();
											}
											handleKeyPress(key);
										}}
										rounded="md"
										className="font-semibold select-none"
									>
										{isUpperCase ? key.toUpperCase() : key}
									</RaisedButton>
								))}
								{rowIndex === 2 && (
									<RaisedButton
										shift
										offset="small"
										variant="action"
										size="wide"
										onPointerDown={(e) => {
											e.preventDefault();
											handleBackspace();
										}}
										className="font-semibold select-none flex items-center justify-center"
										aria-label="Backspace"
									>
										<DeleteIcon className="size-5" />
									</RaisedButton>
								)}
							</div>
						))}
					</div>
					<div className="flex gap-1.5 px-1.5">
						<RaisedButton
							offset="small"
							variant="action"
							size="wide"
							onTouchStart={() => handleKeyPress(".")}
							className="font-semibold select-none w-10 flex items-center justify-center"
						>
							.
						</RaisedButton>
						<RaisedButton
							offset="small"
							variant="action"
							size="wide"
							onTouchStart={() => handleKeyPress("-")}
							className="font-semibold select-none w-10 flex items-center justify-center"
						>
							-
						</RaisedButton>
						<RaisedButton
							offset="small"
							variant="action"
							size="tall"
							onTouchStart={handleSpace}
							className="font-semibold select-none flex-1"
						>
							Space
						</RaisedButton>
						<RaisedButton
							offset="small"
							variant="action"
							size="wide"
							onTouchStart={handleSubmit}
							className="font-semibold select-none w-14 flex items-center justify-center"
							aria-label="Submit"
						>
							<SendIcon className="lg:size-6 size-5" />
						</RaisedButton>
					</div>
				</div>
			)}
		</div>
	);
}

function FakeInput({
	value,
	showKeyboard,
	handleShowKeyboard,
	fakeInputRef,
	isOpen,
}: {
	value: string;
	showKeyboard: boolean;
	handleShowKeyboard: () => void;
	fakeInputRef: React.RefObject<HTMLDivElement>;
	isOpen: boolean;
}) {
	useEffect(() => {
		if (fakeInputRef.current) {
			fakeInputRef.current.scrollLeft = fakeInputRef.current.scrollWidth;
		}
	}, [value]);

	return (
		<div className="relative w-full">
			<div className="relative w-full ">
				<div
					ref={fakeInputRef}
					role="textbox"
					tabIndex={0}
					onClick={handleShowKeyboard}
					className={cn(
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-[calc(100vw-0.25rem)] overflow-hidden h-9",
						"border border-input bg-background px-3 py-2 rounded-md",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
						"relative whitespace-pre",
						"overflow-x-auto",
						{
							"after:content-[''] after:absolute after:h-5 after:w-[2px] after:bg-foreground after:animate-caret after:ml-[1px]":
								showKeyboard && !value,
							"after:content-[''] after:absolute after:h-5 after:w-[2px] after:bg-foreground after:animate-caret after:ml-[1px] after:translate-x-[calc(100%-2px)]":
								showKeyboard && value,
						}
					)}
					style={{
						scrollbarWidth: "none",
						msOverflowStyle: "none",
					}}
					aria-label="Virtual keyboard input"
				>
					{value ? (
						value.replace(/ /g, "\u00A0")
					) : (
						<span className="text-foreground-muted">
							{isOpen ? "" : "Tap to start typing..."}
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
