import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import Canvas from "@/components/canvas";
import { CanvasTools } from "@/components/canvas-tools";
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
			<div className="mx-auto mb-auto lg:my-auto flex flex-col lg:gap-2 gap-1 items-center relative z-50">
				<div className="flex w-full h-full items-start justify-center lg:gap-6 flex-col lg:flex-row">
					{/* <div className="py-16 mt-auto">
						<ColorSliders />
					</div> */}
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
					<Guesses />
				</div>
			</div>
			<AnimatePresence>
				<BobbingDoodle
					hideOnSmallViewports
					duration={4}
					style={{ top: "8%", left: "6%" }}
					src="/doodles/rain-cloud.png"
				/>
			</AnimatePresence>

			<AirplaneDoodle
				skipTransition
				startAt={{ left: "-15%", top: "75%", rotate: 30 }}
				animateTo={{ left: "5%", top: "55%", rotate: 30 }}
				leaveTo={{ left: "105%", top: "55%", rotate: 20 }}
			/>
		</HillScene>
	);
}
