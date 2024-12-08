import { SkyScene } from "@/components/scenes/sky-scene";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { PlayerInfoForm } from "./player-info-form";
import { AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { RoomStage } from "@/state/features/room";
export function EnterPlayerInfoView() {
	const roomStage = useSelector((state: RootState) => state.room.stage);

	const exitPosition = () => {
		switch (roomStage) {
			case RoomStage.PreGame:
				return { left: "80%", top: "-20%", rotate: -5 };
			default:
				return { opacity: 0, left: "5%", top: "55%", rotate: 20 };
		}
	};
	return (
		<SkyScene>
			<PlayerInfoForm />
			<AnimatePresence>
				<BobbingDoodle
					key="rain-cloud-1"
					duration={6}
					style={{ top: "5%", left: "12%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					key="rain-cloud-2"
					hideOnSmallViewports
					duration={4}
					style={{ top: "24%", right: "10%" }}
					src="/doodles/rain-cloud.png"
				/>
			</AnimatePresence>
			<AirplaneDoodle
				startAt={{ left: "-15%", top: "50%", rotate: 25, opacity: 0 }}
				animateTo={{ left: "25%", top: "60%", rotate: 35, opacity: 1 }}
				leaveTo={exitPosition()}
				// skipTransition
			/>
		</SkyScene>
	);
}
