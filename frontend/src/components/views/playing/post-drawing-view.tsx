import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { Timer } from "@/components/timer";
import { HillScene } from "@/components/scenes/hill-scene";

export function PostDrawingView() {
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);

	return (
		<HillScene>
			<div className="absolute top-10 right-10">
				<Timer endTime={deadline} />
			</div>
			<h1 className="text-3xl font-bold">Post-drawing</h1>
		</HillScene>
	);
}
