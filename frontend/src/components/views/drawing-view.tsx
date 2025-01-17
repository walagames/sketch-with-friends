import Canvas from "./components/canvas";
import { CanvasTools, ColorSliders } from "./components/canvas-tools";
import { Chat } from "./components/chat";
import { SkyScene } from "@/components/scenes/sky-scene";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { AnimatePresence } from "framer-motion";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
import { CanvasHeader } from "./components/canvas-header";
import { AnimatedSketchText } from "@/components/ui/game-start-countdown";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";

export function DrawingView() {
	const drawingTime = useSelector(
		(state: RootState) => state.room.settings.drawingTimeAllowed
	);

	const timerEndsAt = useSelector((state: RootState) => state.room.timerEndsAt);

	// Only play the animation within the first second of the drawing phase
	// Otherwise when the tab refocuses, it will play the animation again
	const isWithinFirstSecond =
		drawingTime - (new Date(timerEndsAt).getTime() - Date.now()) / 1000 < 1;
	const [showSketchText, setShowSketchText] = useState(isWithinFirstSecond);

	// Hide the sketch text after the animation is done
	useEffect(() => {
		const timeout = setTimeout(() => {
			setShowSketchText(false);
		}, 1250);

		return () => {
			clearTimeout(timeout);
		};
	}, []);

	return (
		<SkyScene>
			<div className="mx-auto mb-auto lg:my-auto flex flex-col gap-2 items-center relative z-50">
				<div className="flex w-full h-full xl:items-start items-center justify-center lg:gap-4 flex-col xl:flex-row relative">
					<div className="flex items-center justify-center gap-6 pb-1">
						<ColorSliders />
						<div className="flex flex-col items-center justify-center max-w-[800px] w-screen lg:w-auto">
							<CanvasHeader delay={showSketchText ? 1.5 : 0.35} />
							<div className="relative">
								<AnimatePresence>
									{showSketchText && (
										<AnimatedSketchText className="lg:h-[4rem] h-[3rem] text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4 z-50" />
									)}
								</AnimatePresence>
								<Canvas padding={10} width={800} height={600} />
							</div>
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
