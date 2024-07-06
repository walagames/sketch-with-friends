"use client";
import { useRoomContext } from "@/components/room/room-provider";
import Canvas from "@/components/canvas/canvas";
import JoinRoomCard from "@/components/room/join-room";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function Home() {
	const { room, joinRoom } = useRoomContext();
	const params = useSearchParams();
	useEffect(() => {
		const code = params.get("room");
		if (code) {
			joinRoom(code as string);
		}
	}, [params, joinRoom]);

	return (
		<main className="flex min-h-screen flex-col items-center justify-between">
			{room.code ? (
				<Canvas />
			) : (
				<div className="p-24">
					<JoinRoomCard />
				</div>
			)}
		</main>
	);
}
