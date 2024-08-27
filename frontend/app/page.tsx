"use client";
import { useRoomContext } from "@/components/room/room-provider";
import { RoomStatus } from "@/types/room";
import { DrawingGuessingView } from "@/components/room/views/drawing-guessing-view";
import { PlayerCards } from "@/components/room/player-card";
import { CopyRoomLink } from "@/components/canvas/canvas-tools";
import { AnimatePresence } from "framer-motion";
import { WaitingView } from "@/components/room/views/waiting-view";
import { JoinRoomView } from "@/components/room/views/join-room-view";

const views = {
	[RoomStatus.PLAYING]: {
		Component: DrawingGuessingView,
		key: "drawing-guessing",
	},
	[RoomStatus.WAITING]: {
		Component: WaitingView,
		key: "waiting",
	},
	[RoomStatus.UNINITIALIZED]: {
		Component: JoinRoomView,
		key: "join-room",
	},
};

export default function Home() {
	const { room } = useRoomContext();

	const View = views[room.status as keyof typeof views];

	return (
		<main className="flex min-h-screen flex-col items-center justify-between relative">
			<div className="h-screen w-screen flex flex-col relative p-3">
				{room.status !== RoomStatus.UNINITIALIZED && (
					<div className="w-full flex justify-between relative z-50">
						<PlayerCards players={room.players} />
						<CopyRoomLink />
					</div>
				)}
				<AnimatePresence mode="popLayout">
					<View.Component key={View.key} />
				</AnimatePresence>
			</div>
		</main>
	);
}
