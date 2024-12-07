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
					<div className="flex flex-col items-center justify-center max-w-[800px] w-screen lg:w-auto">
						<div className="flex justify-between w-full items-center lg:items-end py-2 px-2">
							<div className="lg:text-2xl whitespace-nowrap flex-wrap flex items-end w-[calc(100%-3rem)] lg:w-auto gap-1">
								<span className="truncate font-bold block pr-1">
									{drawingPlayer?.name}
								</span>
								is drawing: <WordWithLetterBlanks word={selectedWord} />
							</div>
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
