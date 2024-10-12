import { motion } from "framer-motion";
import { useDirectionAnimation } from "@/App";
import { PlayerPane } from "./player-pane";

export function PreGamePlayerView() {
	const directionProps = useDirectionAnimation();

	return (
		<motion.div
			{...directionProps}
			className="flex h-full flex-col items-center justify-center w-full absolute inset-0"
		>
			<PlayerPane isHost={false} />
		</motion.div>
	);
}
