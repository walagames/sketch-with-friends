import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import Canvas from "@/components/canvas";
import { GameRole } from "@/state/features/game";
import { getPickingPlayer } from "@/lib/player";
import { Guesses } from "./guesses";
import { SkyScene } from "@/components/scenes/sky-scene";
import { cn } from "@/lib/utils";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { AnimatePresence } from "framer-motion";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
import { RoundInfo } from "../round-info";

export function DrawingGuesserView() {
	const players = useSelector((state: RootState) => state.room.players);

	const drawingPlayer = getPickingPlayer(players);

	const selectedWord = useSelector(
		(state: RootState) => state.game.selectedWord
	);

	return (
		<SkyScene>
			<div className="mx-auto mb-auto lg:my-auto flex flex-col gap-2 items-center relative z-50">
				<div className="flex w-full h-full lg:justify-center justify-between items-center lg:gap-4 flex-col lg:flex-row relative">
					<div className="flex flex-col items-center justify-center max-w-[800px] w-screen lg:w-auto pb-1">
						<div className="flex flex-col lg:py-2 lg:px-2 w-[calc(100%-7rem)] lg:w-full h-16 justify-center translate-y-1">
							<RoundInfo />
							<span className=" flex items-center gap-1 lg:text-2xl">
								{drawingPlayer?.name} is drawing:{" "}
								<span className="text-lg lg:text-2xl font-bold">
									<WordWithLetterBlanks word={selectedWord} />
								</span>
							</span>
						</div>
						<Canvas
							padding={10}
							width={800}
							height={600}
							role={GameRole.Guessing}
						/>
					</div>
					<Guesses isGuessing />
					<AnimatePresence>
						<BobbingDoodle
							key="rain-cloud-1"
							duration={5}
							className="absolute xl:-top-[18%] xl:-left-[25%] bottom-[12%] left-[10%] w-[8rem] xl:w-[9rem]"
							src="/doodles/rain-cloud.png"
						/>
						<BobbingDoodle
							key="rain-cloud-2"
							duration={4}
							className="absolute hidden lg:block w-[7rem] lg:top-[12%] lg:-right-[20%]"
							src="/doodles/rain-cloud.png"
						/>
					</AnimatePresence>
				</div>
			</div>

			<AirplaneDoodle
				skipTransition
				startAt={{ left: "85%", top: "55%", rotate: 30, opacity: 0 }}
				animateTo={{ left: "85%", top: "55%", rotate: 30, opacity: 1 }}
				leaveTo={{ left: "105%", top: "55%", rotate: 20 }}
			/>
		</SkyScene>
	);
}

function WordWithLetterBlanks({ word }: { word: string }) {
	const wordLetters = word.replaceAll("*", "_").split("");
	return (
		<span className=" lg:text-2xl font-bold inline-flex gap-0.5 px-1.5">
			{wordLetters.map((letter, index) => (
				<span key={index} className={cn(letter === " " && "px-1")}>
					{letter}
				</span>
			))}
		</span>
	);
}
