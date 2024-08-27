"use client";
import Canvas from "@/components/canvas/canvas";
import { useRoomContext } from "./room-provider";
import { useWindowSize } from "@/hooks/use-window-size";
import { CanvasTools } from "../canvas/canvas-tools";
import { GuessForm } from "../canvas/guess-form";
import { GameRole } from "@/types/game";
import { getPlayerRole, getGameRole } from "@/lib/player";
import { motion } from "framer-motion";
const playingView = {
	[GameRole.DRAWING]: DrawingView,
	[GameRole.GUESSING]: GuessingView,
};

export function Playing() {
	const { room, playerId } = useRoomContext();
	const role = getGameRole(playerId, room.players);
	const PlayingView = playingView[role as keyof typeof playingView];
	return (
		<motion.div
			key="playing"
			initial={{ opacity: 0, scale: 0.98 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{
				type: "spring",
				stiffness: 500,
				damping: 50,
				mass: 1,
			}}
			className="h-full w-full flex flex-col items-center justify-center relative"
		>
			<PlayingView />
		</motion.div>
	);
}

export function DrawingView() {
	return (
		<div className="flex flex-col items-center justify-center gap-2">
			<Canvas width={1000} height={750} />
			<CanvasTools />
		</div>
	);
}

export function GuessingView() {
	return (
		<div className="flex flex-col items-center justify-center gap-2">
			<Canvas width={1000} height={750} />
			{/* <CanvasTools /> */}
			<GuessForm
				onSubmit={(guess) => {
					console.log(guess);
				}}
				length={6}
			/>
		</div>
	);
}
