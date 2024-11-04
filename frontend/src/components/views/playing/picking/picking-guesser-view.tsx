import { generateAvatar } from "@/lib/avatar";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { getPickingPlayer } from "@/lib/player";
import { Timer } from "@/components/ui/timer";
import { HillScene } from "@/components/scenes/hill-scene";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { AnimatePresence } from "framer-motion";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";

export function PickingGuesserView() {
	const players = useSelector((state: RootState) => state.room.players);
	const pickingPlayer = getPickingPlayer(players);
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	const isFirstPhase = useSelector(
		(state: RootState) => state.game.isFirstPhase
	);
	if (!pickingPlayer) return null;
	const avatarSvg = generateAvatar(pickingPlayer.avatarSeed);

	return (
		<HillScene>
			<div className="absolute lg:top-10 lg:right-10 top-4 right-4">
				<Timer endTime={deadline} />
			</div>
			<img src={avatarSvg} className="w-20 h-20 rounded-lg shadow-accent" />
			<h1 className="text-2xl lg:text-3xl font-bold px-8 lg:px-0 text-center">
				{pickingPlayer.name} is picking a word
			</h1>
			<AnimatePresence>
				<BobbingDoodle
					hideOnSmallViewports
					duration={4}
					style={{ top: "20%", left: "12%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					duration={5}
					style={{ top: "8%", left: "20%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					hideOnSmallViewports
					duration={4.5}
					style={{ top: "10%", right: "10%" }}
					src="/doodles/rain-cloud.png"
				/>
			</AnimatePresence>

			<AirplaneDoodle
				skipTransition={!isFirstPhase}
				startAt={
					isFirstPhase
						? { left: "-15%", top: "55%", rotate: 20, opacity: 0 }
						: { left: "45%", top: "65%", rotate: 30, opacity: 0 }
				}
				animateTo={{ left: "45%", top: "65%", rotate: 30, opacity: 1 }}
				leaveTo={{ left: "185%", top: "55%", rotate: 30 }}
			/>
		</HillScene>
	);
}
