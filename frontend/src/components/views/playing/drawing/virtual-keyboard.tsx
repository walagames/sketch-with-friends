import { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useDispatch } from "react-redux";
import {
	ArrowBigDownIcon,
	ArrowBigUpIcon,
	DeleteIcon,
	SendIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { containerSpring, containerSpringFast } from "@/config/spring";
import { RaisedButton } from "@/components/ui/raised-button";
const keys = [
	["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
	["a", "s", "d", "f", "g", "h", "j", "k", "l"],
	["z", "x", "c", "v", "b", "n", "m"],
];

function VirtualInput({
	value,
	toggleKeyboard,
	fakeInputRef,
	isOpen,
}: {
	value: string;
	showKeyboard: boolean;
	toggleKeyboard: () => void;
	fakeInputRef: React.RefObject<HTMLDivElement>;
	isOpen: boolean;
}) {
	const inputRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.scrollLeft = inputRef.current.scrollWidth;
		}
	}, [value]);

	return (
		<AnimatePresence>
			<div
				ref={fakeInputRef}
				role="textbox"
				tabIndex={0}
				onClick={toggleKeyboard}
				className="relative flex-1 min-w-0 h-11"
			>
				<div
					className={cn(
						"absolute inset-0",
						"shadow-accent-md bg-background px-3 py-2 rounded-lg",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
						"flex items-center overflow-hidden"
					)}
				>
					<div
						ref={inputRef}
						className="flex-1 min-w-0 overflow-x-auto"
						style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
					>
						{isOpen ? (
							<div className="flex items-center whitespace-nowrap text-lg">
								<span className="text-foreground-muted font-semibold">
									{value.replace(/ /g, "\u00A0")}
								</span>
								<span
									key={value}
									className="h-6 w-0.5 bg-foreground block animate-caret-blink delay-300 -translate-y-[2px] flex-shrink-0 ml-px"
								/>
							</div>
						) : (
							<motion.span
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ ...containerSpring, delay: 0.1 }}
								className="text-foreground-muted font-semibold"
							>
								Tap to start typing...
							</motion.span>
						)}
					</div>
				</div>
			</div>
		</AnimatePresence>
	);
}

function KeyboardButton({
	children,
	onPress,
	className,
	ariaLabel,
	ariaPressed,
}: {
	children: React.ReactNode;
	onPress: (e: React.PointerEvent) => void;
	className?: string;
	ariaLabel?: string;
	ariaPressed?: boolean;
}) {
	return (
		<button
			aria-label={ariaLabel}
			aria-pressed={ariaPressed}
			className={cn("h-11 px-[1px] group", className)}
			onPointerDown={(e) => {
				if (e.pointerType === "touch") {
					e.preventDefault();
					e.stopPropagation();
				}
				onPress(e);
			}}
		>
			<div
				className={cn(
					"font-semibold select-none bg-white border-2 h-full border-foreground/10 group-active:border-foreground rounded-lg flex items-center justify-center text-2xl group-active:bg-zinc-300 group-active:scale-[102%] transition-all duration-100"
				)}
			>
				{children}
			</div>
		</button>
	);
}

export const VirtualKeyboard = forwardRef<
	HTMLDivElement,
	{ className?: string }
>(function VirtualKeyboard({ className }, ref) {
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

	const toggleKeyboard = () => {
		setShowKeyboard(!showKeyboard);
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
		<div
			ref={ref}
			className={cn(
				"flex-1 backdrop-blur-sm rounded-lg flex flex-col max-w-full",
				className
			)}
		>
			<div className="flex mb-2 w-[calc(100%-0.75rem)] mx-auto gap-1 min-w-0">
				<VirtualInput
					value={input}
					showKeyboard={showKeyboard}
					toggleKeyboard={toggleKeyboard}
					fakeInputRef={fakeInputRef}
					isOpen={showKeyboard}
				/>
				<div className="translate-y-1 flex-shrink-0">
					<RaisedButton
						offset="md"
						variant="action"
						size="iconMd"
						onClick={handleSubmit}
						className=""
						aria-label="Submit"
					>
						<SendIcon className="size-5" />
					</RaisedButton>
				</div>
			</div>
			<AnimatePresence>
				{showKeyboard && (
					<motion.div
						ref={keyboardRef}
						className="flex flex-col w-full gap-0.5"
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ ...containerSpringFast }}
					>
						<div className="flex flex-col gap-0.5">
							{keys.map((row, rowIndex) => (
								<div
									style={{
										display: "grid",
										gridAutoFlow: "column",
										gridAutoColumns: "1fr",
									}}
									className="px-0.5"
									key={rowIndex}
								>
									{rowIndex === 2 && (
										<KeyboardButton
											onPress={toggleCase}
											ariaLabel={
												isUpperCase
													? "Switch to lowercase"
													: "Switch to uppercase"
											}
											ariaPressed={isUpperCase}
										>
											{isUpperCase ? (
												<ArrowBigDownIcon className="size-6" />
											) : (
												<ArrowBigUpIcon className="size-6" />
											)}
										</KeyboardButton>
									)}
									{row.map((key) => (
										<KeyboardButton
											key={key}
											onPress={() => handleKeyPress(key)}
										>
											{isUpperCase ? key.toUpperCase() : key}
										</KeyboardButton>
									))}
									{rowIndex === 2 && (
										<KeyboardButton
											onPress={handleBackspace}
											ariaLabel="Backspace"
										>
											<DeleteIcon className="size-5" />
										</KeyboardButton>
									)}
								</div>
							))}
						</div>
						<div className="flex px-0.5">
							<KeyboardButton
								onPress={() => handleKeyPress("-")}
								className="w-10"
							>
								-
							</KeyboardButton>
							<KeyboardButton onPress={handleSpace} className="flex-1">
								Space
							</KeyboardButton>
							<KeyboardButton
								onPress={() => handleKeyPress(".")}
								className="w-10"
							>
								.
							</KeyboardButton>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
});

VirtualKeyboard.displayName = "VirtualKeyboard";
