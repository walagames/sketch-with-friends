import Canvas from "./components/canvas";
import { CanvasTools, ColorSliders } from "./components/canvas-tools";
import { Chat } from "./components/chat";
import { SkyScene } from "@/components/scenes/sky-scene";
import { AnimatePresence } from "framer-motion";
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
					<Chat
						placeholder={
							isDrawing ? "Type your message..." : "Type your guess..."
						}
					/>
				</div>
			</div>
		</SkyScene>
	);
}
