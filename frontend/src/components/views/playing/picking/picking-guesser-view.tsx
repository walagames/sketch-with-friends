import { generateAvatar } from "@/lib/avatar";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { getPickingPlayer } from "@/lib/player";
import { motion } from "framer-motion";
import { useDirectionAnimation } from "@/App";
import { Hills } from "@/components/hills";
import CountdownTimer from "@/components/countdown-timer";

export function PickingGuesserView() {
	const players = useSelector((state: RootState) => state.room.players);
	const directionProps = useDirectionAnimation();
	const pickingPlayer = getPickingPlayer(players);
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	if (!pickingPlayer) return null;
	const avatarSvg = generateAvatar(
		pickingPlayer.avatarSeed,
		pickingPlayer.avatarColor
	);

	return (
		<motion.div
			{...directionProps}
			className="flex h-full flex-col items-center justify-center w-full absolute inset-0 gap-12"
		>
			<div className="absolute top-10 right-10">
				<CountdownTimer key={deadline} endTime={new Date(deadline).getTime()} />
			</div>
			<img src={avatarSvg} className="w-20 h-20 rounded-lg shadow-accent" />
			<h1 className="text-2xl font-bold">
				{pickingPlayer.name} is picking a word to sketch
			</h1>
			<Hills />
		</motion.div>
	);
}
