import Canvas from "./components/canvas";
import { CanvasTools, ColorSliders } from "./components/canvas-tools";
import { Chat } from "./components/chat";
import { SkyScene } from "@/components/scenes/sky-scene";
import { AnimatePresence } from "motion/react";
import { CanvasHeader } from "./components/canvas-header";
import { AnimatedSketchText } from "@/components/ui/game-start-countdown";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { getGameRole } from "@/lib/player";
import { GameRole } from "@/state/features/room";

export function DrawingView() {
	const drawingTime = useSelector(
		(state: RootState) => state.room.settings.drawingTimeAllowed
	);

	const timerEndsAt = useSelector((state: RootState) => state.room.timerEndsAt);

	const players = useSelector((state: RootState) => state.room.players);

	const playerId = useSelector((state: RootState) => state.room.playerId);

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

	const isDrawing = getGameRole(playerId, players) === GameRole.Drawing;

	return (
		<SkyScene>
			<div className="mx-auto mb-auto lg:my-auto flex flex-col gap-2 items-center relative z-50">
				<div className="flex w-full h-full items-center justify-center lg:gap-4 flex-col xl:flex-row relative">
					<div className="flex items-center justify-center gap-6 pb-1">
						<ColorSliders />
						<div className="flex flex-col items-start justify-center">
							<CanvasHeader delay={showSketchText ? 1.5 : 0.35} />
							<div className="relative">
								<AnimatePresence>
									{showSketchText && (
										<AnimatedSketchText className="lg:h-[4rem] h-[3rem] text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4 z-50" />
									)}
								</AnimatePresence>
								<div className="flex flex-col lg:flex-row gap-2 h-[595px]">
									<Canvas padding={10} width={800} height={600} />
									<div className="flex-1 bg-background-secondary/50 backdrop-blur-sm border-4 border-border rounded-lg flex flex-col p-3 w-[22rem] h-full gap-2">
										<h1 className="text-2xl font-bold z-10 leading-none">
											Chat
										</h1>
										<Chat
											placeholder={
												isDrawing
													? "Type your message..."
													: "Type your guess..."
											}
										/>
									</div>
								</div>
							</div>
							<CanvasTools />
						</div>
					</div>
				</div>
			</div>
		</SkyScene>
	);
}
