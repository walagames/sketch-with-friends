import { motion } from "framer-motion";
import { useDirectionAnimation } from "@/App";
import { RoomPane } from "./room-pane";

export function PreGamePlayerView() {
	const directionProps = useDirectionAnimation();

	return (
		<motion.div
			{...directionProps}
			className="flex h-full flex-col items-center justify-center w-full absolute inset-0"
		>
			<RoomPane isHost={false} />
		</motion.div>
	);
}
