import { HillScene } from "@/components/scenes/hill-scene";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { PlayerInfoForm } from "./player-info-form";
import { AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { GamePhase } from "@/state/features/game";
export function EnterPlayerInfoView() {
	const phase = useSelector((state: RootState) => state.game.phase);

	const exitPosition = () => {
		switch (phase) {
			case GamePhase.Unanimous:
				return { left: "80%", top: "-20%", rotate: -5 };
			default:
				return { opacity: 0, left: "-15%", top: "55%", rotate: 20 };
		}
	};
	return (
		<HillScene>
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
				startAt={{ left: "35%", top: "70%", rotate: 40, opacity: 0 }}
				animateTo={{ left: "35%", top: "70%", rotate: 40, opacity: 1 }}
				leaveTo={exitPosition()}
				skipTransition
			/>
		</HillScene>
	);
}
