import { getDrawingPlayer } from "@/lib/player";
import { RootState } from "@/state/store";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { containerSpring } from "@/config/spring";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMemo } from "react";

export function CanvasHeader() {
	const isLargeScreen = useMediaQuery("(min-width: 1024px)"); // matches lg: breakpoint

	const delay = useMemo(() => {
		return isLargeScreen ? 0.1 : 0.35;
	}, [isLargeScreen]);

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 4 }}
			transition={{ ...containerSpring, delay }}
			className="flex flex-col lg:py-2 lg:px-2 w-[calc(100%-7rem)] lg:w-full h-16 justify-center"
		>
			<RoundInfo />
			<DrawingStatus />
		</motion.div>
	);
}

export function DrawingStatus() {
	const selectedWord = useSelector(
		(state: RootState) => state.game.selectedWord
	);
	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.client.id);
	const drawingPlayer = getDrawingPlayer(players);

	const isDrawing = drawingPlayer?.id === playerId;

	if (isDrawing) {
		return (
			<span className="flex items-center gap-1 lg:text-2xl">
				You're drawing:{" "}
				<span className="text-lg lg:text-2xl font-bold">{selectedWord}</span>
			</span>
		);
	}

	const containsLetterBlanks = selectedWord.includes("*");

	return (
		<span className="flex items-center gap-1 lg:text-2xl">
			{drawingPlayer?.profile.name} is drawing:{" "}
			{containsLetterBlanks ? (
				<span className="text-lg lg:text-2xl font-bold">
					<WordWithLetterBlanks word={selectedWord} />
				</span>
			) : (
				<span className="text-lg lg:text-2xl font-bold">{selectedWord}</span>
			)}
		</span>
	);
}

function WordWithLetterBlanks({ word }: { word: string }) {
	const wordLetters = word.replaceAll("*", "_").split("");
	return (
		<motion.span
			className="lg:text-2xl font-bold inline-flex gap-0.5 px-1.5"
			initial="hidden"
			animate="visible"
			variants={{
				hidden: {},
				visible: {
					transition: {
						delayChildren: 0.15,
						staggerChildren: 0.05,
					},
				},
			}}
		>
			{wordLetters.map((letter, index) => (
				<motion.span
					key={index}
					className={letter === " " ? "px-1.5" : undefined}
					variants={{
						hidden: { y: -5, opacity: 0 },
						visible: {
							y: 0,
							opacity: 1,
							transition: {
								type: "spring",
							},
						},
					}}
				>
					{letter}
				</motion.span>
			))}
		</motion.span>
	);
}

export function RoundInfo() {
	const currentRound = useSelector(
		(state: RootState) => state.game.currentRound
	);
	const totalRounds = useSelector(
		(state: RootState) => state.room.settings.totalRounds
	);
	return (
		<div className="flex gap-4 lg:hidden">
			<div className="flex gap-2 font-bold items-center relative text-sm -mb-0.5">
				Round {currentRound} of {totalRounds}
			</div>
		</div>
	);
}
