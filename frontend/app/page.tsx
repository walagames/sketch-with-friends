"use client";
import { useRoomContext } from "@/components/room/room-provider";
import Canvas from "@/components/canvas/canvas";
import { RoomUninitialized } from "@/components/room/room-uninitialized";
import { RoomStatus } from "@/types/room";
import { Button } from "@/components/ui/button";
import Waiting from "@/components/room/waiting";

const roomViews = {
	[RoomStatus.PLAYING]: Canvas,
	[RoomStatus.WAITING]: Waiting,
	[RoomStatus.UNINITIALIZED]: RoomUninitialized,
};

export default function Home() {
	const { room } = useRoomContext();

	const RoomView = roomViews[room.status as keyof typeof roomViews];

	return (
		<main className="flex min-h-screen flex-col items-center justify-between">
			<RoomView />
		</main>
	);
}
