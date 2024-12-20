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
import { containerSpringFast } from "@/config/spring";
const keys = [
	["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
	["a", "s", "d", "f", "g", "h", "j", "k", "l"],
	["z", "x", "c", "v", "b", "n", "m"],
];

function VirtualInput({
	value,
	showKeyboard,
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
	useEffect(() => {
		if (fakeInputRef.current) {
			fakeInputRef.current.scrollLeft = fakeInputRef.current.scrollWidth;
		}
	}, [value]);

	return (
		<div
			ref={fakeInputRef}
			role="textbox"
			tabIndex={0}
			onClick={toggleKeyboard}
			className={cn(
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-[calc(100vw-0.25rem)] overflow-hidden h-11 mb-1",
				"border-2 border-foreground bg-background px-3 py-2 rounded-lg",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				"relative whitespace-pre",
				"overflow-x-auto",
				"",
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
				<span className="text-foreground-muted font-semibold">
					{value.replace(/ /g, "\u00A0")}
				</span>
			) : (
				<span className="text-foreground-muted font-semibold">
					{isOpen ? "" : "Tap to start typing..."}
				</span>
			)}
		</div>
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
			className={cn(
				"font-semibold select-none bg-white border-2 border-foreground/10 active:border-foreground rounded-lg h-10 flex items-center justify-center text-2xl active:bg-zinc-300 active:scale-[102%] transition-all duration-100",
				className
			)}
			onPointerDown={(e) => {
				if (e.pointerType === "touch") {
					e.preventDefault();
					e.stopPropagation();
				}
				onPress(e);
			}}
			aria-label={ariaLabel}
			aria-pressed={ariaPressed}
		>
			{children}
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
				"flex-1  backdrop-blur-sm rounded-lg flex flex-col",
				className
			)}
		>
			<VirtualInput
				value={input}
				showKeyboard={showKeyboard}
				toggleKeyboard={toggleKeyboard}
				fakeInputRef={fakeInputRef}
				isOpen={showKeyboard}
			/>
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
									className="gap-0.5 px-0.5"
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
						<div className="flex gap-0.5 px-0.5">
							<KeyboardButton
								onPress={() => handleKeyPress(".")}
								className="w-10"
							>
								.
							</KeyboardButton>
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
								onPress={handleSubmit}
								className="w-14"
								ariaLabel="Submit"
							>
								<SendIcon className="lg:size-6 size-5" />
							</KeyboardButton>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
});

VirtualKeyboard.displayName = "VirtualKeyboard";
