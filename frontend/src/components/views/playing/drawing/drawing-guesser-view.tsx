import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import Canvas from "@/components/canvas";
import { GameRole } from "@/state/features/game";
import { getPickingPlayer } from "@/lib/player";
import { Guesses } from "./guesses";
import { Timer } from "@/components/ui/timer";
import { HillScene } from "@/components/scenes/hill-scene";
import { cn } from "@/lib/utils";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { AnimatePresence } from "framer-motion";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";

export function DrawingGuesserView() {
	const players = useSelector((state: RootState) => state.room.players);

	const drawingPlayer = getPickingPlayer(players);

	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	const selectedWord = useSelector(
		(state: RootState) => state.game.selectedWord
	);

	return (
		<HillScene>
			<div className="mx-auto mb-auto lg:my-auto flex flex-col gap-2 items-center relative z-50">
				<div className="flex w-full h-full lg:justify-center justify-between items-center lg:gap-4 flex-col lg:flex-row">
					<div className="flex flex-col items-start justify-start max-w-[800px]">
						<div className="flex justify-between w-full items-center py-2">
							<div className="text-xl lg:text-2xl">
								{drawingPlayer?.name} is drawing:{" "}
								<WordWithLetterBlanks word={selectedWord} />
							</div>
							<Timer endTime={deadline} />
						</div>
						<Canvas
							padding={10}
							width={800}
							height={600}
							role={GameRole.Guessing}
						/>
					</div>
					<Guesses isGuessing />
				</div>
			</div>
			<AnimatePresence>
				<BobbingDoodle
					key="rain-cloud-1"
					duration={4}
					className="absolute hidden lg:block top-[2%] right-[4%] w-[7rem]"
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					key="rain-cloud-2"
					duration={4}
					className="absolute hidden lg:block top-[4%] left-[5%] w-[7rem] xl:top-[4%] xl:left-[5%]"
					src="/doodles/rain-cloud.png"
				/>
			</AnimatePresence>

			<AirplaneDoodle
				skipTransition
				startAt={{ left: "85%", top: "55%", rotate: 30, opacity: 0 }}
				animateTo={{ left: "85%", top: "55%", rotate: 30, opacity: 1 }}
				leaveTo={{ left: "105%", top: "55%", rotate: 20 }}
			/>
		</HillScene>
	);
}

function WordWithLetterBlanks({ word }: { word: string }) {
	const wordLetters = word.replaceAll("*", "_").split("");
	return (
		<span className="text-2xl lg:text-3xl font-bold inline-flex gap-1 px-2">
			{wordLetters.map((letter, index) => (
				<span key={index} className={cn(letter === " " && "px-1")}>
					{letter}
				</span>
			))}
		</span>
	);
}
