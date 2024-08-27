"use client";
import { useRoomContext } from "@/components/room/room-provider";
import Canvas from "@/components/canvas/canvas";
import { RoomUninitialized } from "@/components/room/room-uninitialized";
import { RoomStatus } from "@/types/room";
import { Button } from "@/components/ui/button";
import Waiting from "@/components/room/room-waiting";
import { RoomLayout } from "@/components/room/room-layout";
import { Playing } from "@/components/room/room-playing";
import { AnimatePresence } from "framer-motion";
const roomViews = {
	[RoomStatus.PLAYING]: Playing,
	[RoomStatus.WAITING]: Waiting,
	[RoomStatus.UNINITIALIZED]: RoomUninitialized,
};

export default function Home() {
	const { room } = useRoomContext();

	const RoomView = roomViews[room.status as keyof typeof roomViews];

	return (
		<main className="flex min-h-screen flex-col items-center justify-between relative">
			<RoomLayout>
				<AnimatePresence mode="popLayout">
					{room.status === RoomStatus.PLAYING && <Playing key="playing" />}
					{room.status === RoomStatus.UNINITIALIZED && (
						<RoomUninitialized key="uninitialized" />
					)}
					{room.status === RoomStatus.WAITING && <Waiting key="waiting" />}
				</AnimatePresence>
			</RoomLayout>
		</main>
	);
}
