import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import CountdownTimer from "@/components/countdown-timer";
import Canvas from "@/components/canvas";
import { GameRole } from "@/state/features/game";
import { motion } from "framer-motion";
import { useDirectionAnimation } from "@/App";
import { Hills } from "@/components/hills";
import { getPickingPlayer } from "@/lib/player";
import { Guesses } from "./guesses";

export function DrawingGuesserView() {
	const directionProps = useDirectionAnimation();

	const players = useSelector((state: RootState) => state.room.players);

	const drawingPlayer = getPickingPlayer(players);

	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	const selectedWord = useSelector(
		(state: RootState) => state.game.selectedWord
	);

	return (
		<motion.div
			{...directionProps}
			className="flex h-full flex-col items-center justify-center w-full absolute inset-0"
		>
			<div className="mx-auto my-auto flex flex-col gap-2 items-center relative z-50">
				<div className="flex w-full h-full items-center justify-center gap-6">
					<div className="flex flex-col items-center justify-center gap-4 w-[800px]">
						<div className="flex justify-between w-full items-end">
							<div className="text-2xl">
								{drawingPlayer?.name} is drawing:{" "}
								<WordWithLetterBlanks word={selectedWord} />
							</div>
							<CountdownTimer
								key={deadline}
								endTime={new Date(deadline).getTime()}
							/>
						</div>
						<Canvas width={800} height={600} role={GameRole.Guessing} />
					</div>
					<Guesses isGuessing />
				</div>
			</div>
			<Hills />
		</motion.div>
	);
}

function WordWithLetterBlanks({ word }: { word: string }) {
	const wordLetters = word.replaceAll("*", "_").split("");
	return (
		<span className="text-3xl font-bold">
			{wordLetters.map((letter, index) => (
				<span key={index}>{letter}</span>
			))}
		</span>
	);
}
