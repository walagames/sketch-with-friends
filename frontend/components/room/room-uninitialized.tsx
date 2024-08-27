import Image from "next/image";
import { RoomJoinForm } from "./room-join-form";

export function RoomUninitialized() {
	return (
		<div className="h-full w-full flex flex-col items-center justify-center gap-8">
			<div className="flex items-center gap-3">
				<Image
					className="rotate-12"
					src="/logo.png"
					alt="logo"
					width={44}
					height={44}
				/>
				<h1
					style={{ wordSpacing: "0.01em" }}
					className="text-4xl font-medium tracking-tight"
				>
					Sketch with Friends
				</h1>
			</div>
			<RoomJoinForm />
		</div>
	);
}
