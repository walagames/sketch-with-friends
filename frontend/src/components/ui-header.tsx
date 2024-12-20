import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { ModalMenu } from "./ui/modal-menu";
import { RoomStage } from "@/state/features/room";
import { cn } from "@/lib/utils";
import { Timer } from "./ui/timer";
import { containerSpring } from "@/config/spring";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";

export function UIHeader() {
	const stage = useSelector((state: RootState) => state.room.stage);

	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);

	const showTimer = stage === RoomStage.Playing;

	return (
		<AnimatePresence initial={false}>
			<header
				className={cn(
					"absolute lg:top-5 top-1.5 w-full lg:px-6 px-2 items-center z-50 flex",
					showTimer ? "justify-between" : "justify-end"
				)}
			>
				{showTimer && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: -1 }}
						transition={{ ...containerSpring, delay: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="flex items-center gap-2"
					>
						<Timer endTime={deadline} />
					</motion.div>
				)}
				<ModalMenu />
			</header>
		</AnimatePresence>
	);
}
