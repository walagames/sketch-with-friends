import { getDrawingPlayer } from "@/lib/player";
import { RootState } from "@/state/store";
import { useSelector } from "react-redux";
import { motion } from "motion/react";
import { containerSpring } from "@/config/spring";
export function CanvasHeader({ delay }: { delay: number }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 4 }}
			transition={{ ...containerSpring, delay }}
			className="flex flex-col lg:py-2 lg:px-2 w-[calc(100%-8rem)] ml-[3.125rem] lg:ml-0 pr-3 lg:w-full h-16 pt-2 justify-center"
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
	const playerId = useSelector((state: RootState) => state.room.playerId);
	const drawingPlayer = getDrawingPlayer(players);

	const isDrawing = drawingPlayer?.id === playerId;

	if (isDrawing) {
		return (
			<span className="flex items-center text-sm gap-1 lg:text-2xl">
				You're sketching:{" "}
				<span className="lg:text-2xl font-bold">{selectedWord?.value}</span>
			</span>
		);
	}

	const containsLetterBlanks = selectedWord?.value.includes("*");

	return (
		<span className="flex items-start flex-wrap text-sm lg:text-2xl gap-1">
			<span className="flex-wrap">
				{drawingPlayer?.username} is sketching:{" "}
			</span>
			{containsLetterBlanks ? (
				<span className=" lg:text-2xl font-bold">
					<WordWithLetterBlanks
						word={selectedWord?.value ?? ""}
						delay={delay - 0.1}
					/>
				</span>
			) : (
				<span className=" lg:text-2xl font-bold">{selectedWord?.value}</span>
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
		<span className="lg:text-2xl font-bold inline-flex gap-4 px-1.5">
			{processedSegments.map((segment, segmentIndex) => (
				<motion.span
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
					key={segmentIndex}
					className="flex items-center gap-1 relative"
				>
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
							className=" text-xs"
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
							({segment.count})
						</motion.span>
					)}
				</motion.span>
			))}
		</span>
	);
}

export function RoundInfo() {
	const currentRound = useSelector(
		(state: RootState) => state.room.currentRound
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
