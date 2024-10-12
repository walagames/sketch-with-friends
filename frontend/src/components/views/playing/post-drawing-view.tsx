import CountdownTimer from "@/components/countdown-timer";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { motion } from "framer-motion";
import { useDirectionAnimation } from "@/App";
import { Hills } from "@/components/hills";

export function PostDrawingView() {
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	const directionProps = useDirectionAnimation();

	return (
		<motion.div
			{...directionProps}
			className="flex h-full flex-col items-center justify-center w-full absolute inset-0"
		>
			<div>
				PostDrawingView <CountdownTimer endTime={deadline} />
			</div>
			<Hills />
		</motion.div>
	);
}
