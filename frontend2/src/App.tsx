import "./App.css";
import { Toaster } from "@/components/ui/sonner";
import { RoomViewManager } from "./components/views/components/room-view-manager";
import { MotionConfig } from "motion/react";
import { containerSpring } from "./config/spring";

function App() {
	return (
		<main className="flex min-h-[100dvh] flex-col items-center justify-between relative">
			<MotionConfig reducedMotion="user" transition={containerSpring}>
				<RoomViewManager />
			</MotionConfig>
			<Toaster
				offset={16}
				className="Toaster"
				toastOptions={{
					classNames: {
						toast: "px-4 py-2 !font-bold",
					},
					style: {
						boxShadow: "-4px 4px 0px #333333",
						fontFamily: "Nokora",
						fontWeight: "600",
					},
				}}
				position="top-center"
			/>
		</main>
	);
}

export default App;
