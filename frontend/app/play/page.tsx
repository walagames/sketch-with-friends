"use client";

import { Toaster } from "@/components/ui/sonner";
import { UIHeader } from "@/components/ui/ui-header";
import { RoomViewManager } from "@/components/views/components/room-view-manager";
import { containerSpring } from "@/config/spring";
import { SoundProvider } from "@/providers/sound-provider";
import { store } from "@/state/store";
import { MotionConfig } from "motion/react";
import { Provider } from "react-redux";

export default function Home() {
	return (
		<main className="flex flex-col h-[100dvh] w-screen">
			<Provider store={store}>
				<SoundProvider>
					<MotionConfig reducedMotion="user" transition={containerSpring}>
						<UIHeader />
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
				</SoundProvider>
			</Provider>
		</main>
	);
}
