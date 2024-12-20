import Canvas from "./canvas";
import { CanvasTools, ColorSliders } from "./canvas-tools";
import { Chat } from "./chat";
import { SkyScene } from "@/components/scenes/sky-scene";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { AnimatePresence } from "framer-motion";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
import { CanvasHeader } from "./canvas-header";

export function DrawingView() {
	return (
		<SkyScene>
			<div className="mx-auto mb-auto xl:my-auto flex flex-col lg:gap-2 gap-1 relative z-50">
				<div className="flex w-full h-full xl:items-start items-center justify-center lg:gap-4 flex-col xl:flex-row relative">
					<div className="flex items-center justify-center gap-6 pb-1">
						<ColorSliders />
						<div className="flex flex-col items-center justify-center max-w-[800px] w-screen lg:w-auto">
							<CanvasHeader />
							<Canvas padding={10} width={800} height={600} />
							<CanvasTools />
						</div>
					</div>
					<Chat />
					<AnimatePresence>
						<BobbingDoodle
							key="rain-cloud-1"
							duration={5}
							className="absolute xl:-top-[10%] xl:-left-[20%] bottom-[14%] right-[14%] w-[8rem] xl:w-[9rem]"
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
