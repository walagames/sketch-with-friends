import "./App.css";
import { Toaster } from "@/components/ui/sonner";
import { MotionConfig } from "framer-motion";
import { containerSpring } from "@/config/spring";
import { RoomViewContainer } from "@/hooks/use-view-transition";

function App() {
	return (
		<main className="flex min-h-[100dvh] flex-col items-center justify-between relative">
			<div className="h-[100dvh] w-screen flex flex-col items-center justify-center relative overflow-hidden">
				<MotionConfig reducedMotion="user" transition={containerSpring}>
					<RoomViewContainer />
				</MotionConfig>
			</div>
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
