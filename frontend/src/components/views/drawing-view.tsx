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
import { MessageCircleIcon } from "lucide-react";

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

	const currentRound = useSelector(
		(state: RootState) => state.room.currentRound
	);
	const totalRounds = useSelector(
		(state: RootState) => state.room.settings.totalRounds
	);

	return (
		<SkyScene>
			<div className="mx-auto mb-auto lg:my-auto flex flex-col gap-2 items-center relative z-50">
				<div className="flex w-full h-full items-center justify-center lg:gap-4 flex-col xl:flex-row relative">
					<div className="flex items-center justify-center gap-6 pb-1">
						<ColorSliders />
						<div className="flex flex-col  justify-center">
							<div className="relative h-dvh sm:h-auto">
								<CanvasHeader delay={showSketchText ? 1.5 : 0.35} />
								<div className="flex flex-col lg:flex-row gap-2 lg:h-[595px] h-[calc(100dvh-3.5rem)]">
									<div className="relative">
										<AnimatePresence>
											{showSketchText && (
												<AnimatedSketchText className="lg:h-[4rem] h-[3rem] text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4 z-50" />
											)}
										</AnimatePresence>
										<Canvas padding={10} width={800} height={600} />
									</div>
									{/* Canvas tools for mobile view */}
									<div className="lg:hidden">
										<CanvasTools />
									</div>
									<div className="relative flex-1 flex flex-col">
										<div className="w-full bg-gradient-to-b from-background-secondary via-background-secondary/80 to-background-transparent absolute -top-12 left-0 lg:h-12 h-10 z-50 items-center px-2 justify-between hidden lg:flex	">
											<h1 className="lg:text-xl text-lg font-bold z-10 leading-none flex items-center gap-1.5">
												<MessageCircleIcon className="size-5 -translate-y-0.5" />
												Chat
											</h1>
											<p className="font-bold text-lg text-muted-foreground">
												Round {currentRound} of {totalRounds}
											</p>
										</div>
										<div className="flex-1 bg-background-secondary/50 backdrop-blur-sm border-4 border-border border-dashed rounded-xl flex flex-col lg:w-[22rem] w-full lg:h-full h-auto relative overflow-hidden">
											<div className="w-full bg-gradient-to-b from-background-secondary via-background-secondary to-background-transparent absolute top-0 left-0 h-12 z-50 items-start px-2 py-1.5 justify-between flex sm:hidden">
												<div className="w-full bg-gradient-to-b from-background-secondary via-background-secondary/80 to-background-transparent absolute top-0 left-0 lg:h-12 h-10 z-50 flex items-center px-2 justify-between">
													<h1 className="text-lg font-bold z-10 leading-none flex items-center gap-1.5">
														<MessageCircleIcon className="size-6 -translate-y-0.5" />
														Chat
													</h1>
													<p className="font-bold text-lg text-muted-foreground">
														Round {currentRound} of {totalRounds}
													</p>
												</div>
											</div>
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
							</div>
							{/* Canvas tools for desktop */}
							<div className="hidden lg:flex">
								<CanvasTools />
							</div>
						</div>
					</div>
				</div>
			</div>
		</SkyScene>
	);
}
