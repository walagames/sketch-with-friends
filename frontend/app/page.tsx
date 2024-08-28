"use client";
import { useRoomContext } from "@/contexts/room-context";
import { RoomStatus } from "@/types/room";
import { PlayingView } from "@/components/room/views/playing-view";
import { PlayerCards } from "@/components/room/player-card";
import { CopyRoomLink } from "@/components/canvas/canvas-tools";
import { AnimatePresence } from "framer-motion";
import { WaitingView } from "@/components/room/views/waiting-view";
import { JoinRoomView } from "@/components/room/views/join-room-view";

const views = {
	[RoomStatus.PLAYING]: {
		Component: PlayingView,
		key: "playing",
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
				<AnimatePresence mode="popLayout">
					{room.status !== RoomStatus.UNINITIALIZED && (
						<div className="w-full flex justify-between relative z-50">
							<PlayerCards orientation="horizontal" players={room.players} />
							<CopyRoomLink />
						</div>
					)}
					<View.Component key={View.key} />
				</AnimatePresence>
			</div>
		</main>
	);
}
