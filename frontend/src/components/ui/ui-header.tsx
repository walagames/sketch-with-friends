import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { ModalMenu } from "./modal-menu";
import { RoomState } from "@/state/features/room";
import { cn } from "@/lib/utils";
import { Timer } from "./timer";
import { containerSpring } from "@/config/spring";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";

export function UIHeader() {
	const currentState = useSelector(
		(state: RootState) => state.room.currentState
	);

	const deadline = useSelector((state: RootState) => state.room.timerEndsAt);

	const showTimer =
		currentState !== RoomState.Waiting && currentState !== RoomState.Unanimous;

	const isLargeScreen = useMediaQuery("(min-width: 1024px)");

	const renderHeader = showTimer || isLargeScreen;

	return (
		<AnimatePresence initial={false}>
			{renderHeader && (
				<motion.header
					initial={{ opacity: 0, y: -10 }}
					animate={{
						opacity: 1,
						y: -1,
					}}
					transition={{ ...containerSpring, delay: 0.05 }}
					exit={{ opacity: 0, y: -10 }}
					className={cn(
						"absolute lg:top-5 top-2 w-full lg:px-6 px-2.5 items-start z-50 flex",
						showTimer ? "justify-between" : "justify-end"
					)}
				>
					{showTimer && (
						<div className="-translate-y-1">
							<Timer endTime={deadline} />
						</div>
					)}
					<ModalMenu />
				</motion.header>
			)}
		</AnimatePresence>
	);
}
