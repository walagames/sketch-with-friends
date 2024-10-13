import CountdownTimer from "@/components/countdown-timer";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { Hills } from "@/components/hills";

export function PostDrawingView() {
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);

	return (
		<div className="flex h-full flex-col items-center justify-center w-full">
			<div className="absolute top-10 right-10">
				<CountdownTimer key={deadline} endTime={new Date(deadline).getTime()} />
			</div>
			<h1 className="text-3xl font-bold">Post-drawing</h1>
			<Hills />
			{/* so that hills still appear on the right when spring overshoots */}
			<Hills className="absolute bottom-0 left-full w-full " />
		</div>
	);
}
