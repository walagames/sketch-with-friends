import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
import { AnimatePresence } from "framer-motion";
export function SkyScene({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex h-full flex-col items-center justify-center w-full relative">
			{children}
			<AirplaneDoodle
				startAt={{ left: "80%", top: "80%", rotate: -5, opacity: 0 }}
				animateTo={{ opacity: 1, left: "80%", top: "80%", rotate: -5 }}
				leaveTo={{ left: "135%", top: "70%", rotate: 40 }}
				skipTransition
			/>
			<AnimatePresence>
				<BobbingDoodle
					duration={5}
					style={{ top: "8%", left: "12%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					duration={4}
					style={{ top: "24%", right: "10%" }}
					src="/doodles/rain-cloud.png"
				/>
			</AnimatePresence>
		</div>
	);
}
