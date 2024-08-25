import Image from "next/image";
import { RoomForm } from "./room-form";

export function RoomUninitialized() {
	return (
		<div className="w-screen h-screen flex flex-col items-center justify-center gap-8">
			<div className="flex items-center gap-3">
				<Image
					className="rotate-12"
					src="/logo.png"
					alt="logo"
					width={48}
					height={48}
				/>
				<h1
					style={{ wordSpacing: "0.01em" }}
					className="text-4xl font-medium tracking-tight"
				>
					Sketch with Friends
				</h1>
			</div>
			<RoomForm />
		</div>
	);
}
