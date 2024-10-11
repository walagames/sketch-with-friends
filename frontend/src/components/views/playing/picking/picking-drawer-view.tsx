import CountdownTimer from "@/components/countdown-timer";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { selectWord } from "@/state/features/game";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";

export function PickingDrawerView() {
	const dispatch = useDispatch();
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	const wordOptions = useSelector((state: RootState) => state.game.wordOptions);
	return (
		<div className="flex flex-col items-center justify-center gap-2">
			<CountdownTimer endTime={deadline} />
			<h1 className="text-2xl font-medium">Pick a word</h1>
			<div className="flex items-center justify-center gap-2">
				{wordOptions.map((word) => (
					<Button key={word} onClick={() => dispatch(selectWord(word))}>
						{word}
					</Button>
				))}
			</div>
		</div>
	);
}
