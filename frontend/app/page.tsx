"use client";
import { useRoomContext } from "@/components/room/room-provider";
import Canvas from "@/components/canvas/canvas";
import { RoomForm } from "@/components/room/room-form";

export default function Home() {
	const { room } = useRoomContext();

	return (
		<main className="flex min-h-screen flex-col items-center justify-between">
			{room.code ? (
				<Canvas />
			) : (
				<div className="p-24">
					<RoomForm />
				</div>
			)}
		</main>
	);
}
