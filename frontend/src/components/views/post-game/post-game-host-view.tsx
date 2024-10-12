import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { useDirectionAnimation } from "@/App";

export function PostGameHostView() {
	const dispatch = useDispatch();
	const directionProps = useDirectionAnimation();

	return (
		<motion.div
			{...directionProps}
			className="flex h-full flex-col items-center justify-center w-full absolute inset-0"
		>
			PostGameHostView{" "}
			<button onClick={() => dispatch({ type: "game/startGame" })}>
				start game
			</button>
		</motion.div>
	);
}
