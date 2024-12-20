import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { ModalMenu } from "./ui/modal-menu";
import { RoomStage } from "@/state/features/room";
import { cn } from "@/lib/utils";
import { Timer } from "./ui/timer";

const hideHeader = (stage: RoomStage) => {
	return stage === RoomStage.PreGame;
};

export function UIHeader() {
	const stage = useSelector((state: RootState) => state.room.stage);

	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);

	const showTimer = stage === RoomStage.Playing;

	return (
		<header
			className={cn(
				"absolute lg:top-5 top-1 w-full lg:px-6 px-2 items-center z-50",
				showTimer ? "justify-between" : "justify-end",
				hideHeader(stage) ? "lg:flex hidden" : "flex"
			)}
		>
			{showTimer && <Timer endTime={deadline} />}
			<ModalMenu />
		</header>
	);
}
