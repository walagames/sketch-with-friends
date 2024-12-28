import { getDrawingPlayer } from "@/lib/player";
import { RootState } from "@/state/store";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { containerSpring } from "@/config/spring";
export function CanvasHeader({ delay }: { delay: number }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 4 }}
			transition={{ ...containerSpring, delay }}
			className="flex flex-col lg:py-2 lg:px-2 w-[calc(100%-7rem)] lg:w-full h-16 justify-center"
		>
			<RoundInfo />
			<DrawingStatus delay={delay} />
		</motion.div>
	);
}

export function DrawingStatus({ delay }: { delay: number }) {
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
				You're sketching:{" "}
				<span className="text-lg lg:text-2xl font-bold">{selectedWord}</span>
			</span>
		);
	}

	const containsLetterBlanks = selectedWord.includes("*");

	return (
		<span className="flex items-center gap-1 lg:text-2xl">
			{drawingPlayer?.profile.name} is sketching:{" "}
			{containsLetterBlanks ? (
				<span className="text-lg lg:text-2xl font-bold">
					<WordWithLetterBlanks word={selectedWord} delay={delay - 1} />
				</span>
			) : (
				<span className="text-lg lg:text-2xl font-bold">{selectedWord}</span>
			)}
		</span>
	);
}

function WordWithLetterBlanks({
	word,
	delay,
}: {
	word: string;
	delay: number;
}) {
	// Split only by spaces first
	const spaceSeparatedParts = word
		.split(" ")
		.filter((segment) => segment.length > 0);
	const processedSegments = spaceSeparatedParts
		.map((part) => {
			// Split by dashes but keep the dashes
			const subParts = part
				.split(/(?=-)|(?<=-)/)
				.filter((segment) => segment.length > 0);
			return subParts.map((segment) => ({
				text: segment.replaceAll("*", "_"),
				// Only count length if it's not a dash
				count: segment === "-" ? 0 : segment.length,
				isDash: segment === "-",
			}));
		})
		.flat();

	return (
		<motion.span
			className="lg:text-2xl font-bold inline-flex gap-0.5 px-1.5"
			initial="hidden"
			animate="visible"
			variants={{
				hidden: {},
				visible: {
					transition: {
						delayChildren: delay,
						staggerChildren: 0.025,
					},
				},
			}}
		>
			{processedSegments.map((segment, segmentIndex) => (
				<motion.span key={segmentIndex} className="flex items-center gap-1">
					{segment.text.split("").map((letter, letterIndex) => (
						<motion.span
							key={letterIndex}
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
					{!segment.isDash && (
						<motion.span
							className="!text-xs ml-1 mt-3 lg:mt-6"
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
							{segment.count}
						</motion.span>
					)}
					{segmentIndex < processedSegments.length - 1 &&
						!segment.isDash &&
						processedSegments[segmentIndex + 1].text !== "-" && (
							<motion.span
								className="px-1.5"
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
								{" "}
							</motion.span>
						)}
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
