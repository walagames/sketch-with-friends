import { HillScene } from "@/components/scenes/hill-scene";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { PlayerInfoForm } from "./player-info-form";
import { AnimatePresence } from "framer-motion";
export function EnterPlayerInfoView() {
	return (
		<HillScene>
			<PlayerInfoForm />
			<AirplaneDoodle
				startAt={{ left: "35%", top: "70%", rotate: 40, opacity: 0 }}
				animateTo={{ left: "35%", top: "70%", rotate: 40, opacity: 1 }}
				leaveTo={{ left: "80%", top: "-20%", rotate: -5 }}
				skipTransition
			/>
			<AnimatePresence>
				<BobbingDoodle
					duration={6}
					style={{ top: "8%", left: "12%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					duration={4}
					style={{ top: "24%", right: "10%" }}
					src="/doodles/rain-cloud.png"
				/>
			</AnimatePresence>
		</HillScene>
	);
}
