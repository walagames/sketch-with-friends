import { motion } from "framer-motion";
import { useDirectionAnimation } from "@/App";

export function PostGamePlayerView() {
	const directionProps = useDirectionAnimation();

	return (
		<motion.div {...directionProps} className="flex h-full flex-col items-center justify-center">
				<div>PostGamePlayerView</div>
		</motion.div>
	);
}
