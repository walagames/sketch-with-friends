import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import Canvas from "@/components/canvas";
import { CanvasTools, ColorSliders } from "@/components/canvas-tools";
import { GameRole } from "@/state/features/game";
import { Guesses } from "./guesses";
import { SkyScene } from "@/components/scenes/sky-scene";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { AnimatePresence } from "framer-motion";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
import { RoundInfo } from "../round-info";
import { motion } from "framer-motion";
export function DrawingDrawerView() {
	const selectedWord = useSelector(
		(state: RootState) => state.game.selectedWord
	);

	return (
		<SkyScene>
			<div className="mx-auto mb-auto xl:my-auto flex flex-col lg:gap-2 gap-1  relative z-50">
				<div className="flex w-full h-full xl:items-start items-center justify-center lg:gap-4 flex-col xl:flex-row relative">
					<div className="flex items-center justify-center gap-6 pb-1">
						<div className="py-20 mt-auto hidden lg:block">
							<ColorSliders />
						</div>
						<div className="flex flex-col items-center justify-center max-w-[800px] w-screen lg:w-auto">
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 4 }}
								transition={{ delay: 0.55 }}
								className="flex flex-col lg:py-2 lg:px-2 w-[calc(100%-7rem)] lg:w-full h-16 justify-center"
							>
								<RoundInfo />
								<span className=" flex items-center gap-1 lg:text-2xl">
									You're drawing:{" "}
									<span className="text-lg lg:text-2xl font-bold">
										{selectedWord}
									</span>
								</span>
							</motion.div>
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
					<AnimatePresence>
						<BobbingDoodle
							key="rain-cloud-1"
							duration={5}
							className="absolute xl:-top-[10%] xl:-left-[20%] bottom-[6%] right-[10%] w-[8rem] xl:w-[9rem]"
							src="/doodles/rain-cloud.png"
						/>
						<BobbingDoodle
							key="rain-cloud-2"
							duration={4}
							className="absolute hidden lg:block w-[7rem] xl:top-[12%] xl:-right-[20%]"
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
