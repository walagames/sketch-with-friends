"use client";
import Image from "next/image";
import { useRoomContext } from "@/components/room-provider";
import Canvas from "@/components/canvas/canvas";
import JoinRoomCard from "@/components/join-room";

export default function Home() {
	const { state } = useRoomContext();
	return (
		<main className="flex min-h-screen flex-col items-center justify-between">
			{state.code ? (
				<Canvas />
			) : (
				<div className="p-24">
					<JoinRoomCard />
				</div>
			)}
		</main>
	);
}
