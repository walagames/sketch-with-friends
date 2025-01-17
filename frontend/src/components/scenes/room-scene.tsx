import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
import { AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { RoomState } from "@/state/features/room";

export function RoomScene({ children }: { children: React.ReactNode }) {
	const currentState = useSelector(
		(state: RootState) => state.room.currentState
	);

	const shouldSkipTransition =
		currentState === RoomState.Unanimous || currentState === RoomState.GameOver;

	return (
		<div className="flex h-full flex-col items-center justify-center w-full relative">
			{children}
			<AirplaneDoodle
				// layoutId="airplane-sky"
				startAt={{ left: "60%", top: "105%", rotate: -5, opacity: 0 }}
				animateTo={{ opacity: 1, left: "80%", top: "80%" }}
				leaveTo={{ left: "135%", top: "70%", rotate: 40 }}
				skipTransition={shouldSkipTransition}
			/>
			<AnimatePresence>
				<BobbingDoodle
					hideOnSmallViewports
					duration={5}
					style={{ top: "8%", left: "12%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					hideOnSmallViewports
					duration={4}
					style={{ top: "24%", right: "10%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					className="absolute lg:hidden w-28"
					duration={4}
					style={{ bottom: "24%", right: "16%" }}
					src="/doodles/rain-cloud.png"
				/>
			</AnimatePresence>
		</div>
	);
}
