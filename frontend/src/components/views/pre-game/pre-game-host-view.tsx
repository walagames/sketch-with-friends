import { motion } from "framer-motion";
import { useDirectionAnimation } from "@/App";
import { PlayerPane } from "./player-pane";

export function PreGameHostView() {
	const directionProps = useDirectionAnimation();

	return (
		<motion.div
			{...directionProps}
			className="flex h-full flex-col items-center justify-center w-full absolute inset-0 gap-4"
		>
			<PlayerPane isHost={true} />
		</motion.div>
	);
}
