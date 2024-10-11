import CountdownTimer from "@/components/countdown-timer";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";

export function PostDrawingView() {
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	return (
		<div>
			PostDrawingView <CountdownTimer endTime={deadline} />
		</div>
	);
}
