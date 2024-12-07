import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { ModalMenu } from "./ui/modal-menu";
import { RoomStage } from "@/state/features/room";
import { GamePhase } from "@/state/features/game";
import { cn } from "@/lib/utils";
import { Timer } from "./ui/timer";

const hideHeader = (stage: RoomStage, phase: GamePhase) => {
	return phase === GamePhase.Drawing || stage === RoomStage.PreGame;
};

export function UIHeader() {
	const stage = useSelector((state: RootState) => state.room.stage);
	const phase = useSelector((state: RootState) => state.game.phase);

	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);

	const showTimer = stage === RoomStage.Playing;

	return (
		<header
			className={cn(
				"absolute top-5 w-full px-6 items-center z-50",
				hideHeader(stage, phase) ? "hidden sm:flex" : "flex",
				showTimer ? "justify-between" : "justify-end"
			)}
		>
			{showTimer && <Timer endTime={deadline} />}
			<ModalMenu />
		</header>
	);
}
