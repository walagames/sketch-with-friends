import CountdownTimer from "@/components/countdown-timer";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import Canvas from "@/components/canvas";
import { CanvasTools } from "@/components/canvas-tools";
import { GameRole } from "@/state/features/game";

export function DrawingDrawerView() {
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	const selectedWord = useSelector(
		(state: RootState) => state.game.selectedWord
	);
	const currentRound = useSelector(
		(state: RootState) => state.game.currentRound
	);
	const totalRounds = useSelector(
		(state: RootState) => state.room.settings.totalRounds
	);
	return (
		<div className="flex flex-col  items-start justify-center gap-2">
			<div className="flex justify-between w-full items-center">
				<div className="flex items-center justify-center text-2xl gap-1.5">
					Round <span className="font-medium">{currentRound}</span> of{" "}
					<span className="font-medium">{totalRounds}</span>
				</div>

				<div className="text-2xl mx-auto">{selectedWord}</div>
				<CountdownTimer endTime={deadline} />
			</div>
			<div className="flex w-full h-full items-start justify-center gap-2">
				<div className="flex flex-col items-center justify-center gap-2 w-[800px]">
					<Canvas width={800} height={600} role={GameRole.Drawing} />
					<CanvasTools />
				</div>
			</div>
		</div>
	);
}
