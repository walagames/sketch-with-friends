import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import Canvas from "@/components/canvas";
import { CanvasTools, ColorSliders } from "@/components/canvas-tools";
import { GameRole } from "@/state/features/game";
import { Guesses } from "./guesses";
import { Timer } from "@/components/ui/timer";
import { HillScene } from "@/components/scenes/hill-scene";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { AnimatePresence } from "framer-motion";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
export function DrawingDrawerView() {
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	const selectedWord = useSelector(
		(state: RootState) => state.game.selectedWord
	);

	return (
		<HillScene>
			<div className="mx-auto mb-auto xl:my-auto flex flex-col lg:gap-2 gap-1 items-center relative z-50">
				<div className="flex w-full h-full items-start justify-center xl:gap-6 flex-col xl:flex-row">
					<div className="flex items-center justify-center gap-6">
						<div className="py-20 mt-auto hidden lg:block">
							<ColorSliders />
						</div>
						<div className="flex flex-col items-center justify-center max-w-[800px]">
							<div className="flex justify-between w-full items-center py-2">
								<div className="text-lg lg:text-2xl">
									You're drawing:{" "}
									<span className="text-xl lg:text-3xl font-bold">
										{selectedWord}
									</span>
								</div>
								<Timer endTime={deadline} />
							</div>
							<Canvas
								padding={10}
								width={800}
								height={600}
								role={GameRole.Drawing}
							/>
							<CanvasTools />
						</div>
					</div>
					<Guesses />
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
				style={{ left: "85%", top: "55%", rotate: "30deg", opacity: 1 }}
				leaveTo={{ left: "105%", top: "55%", rotate: 20 }}
			/>
		</HillScene>
	);
}
