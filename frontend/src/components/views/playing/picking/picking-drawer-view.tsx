import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { selectWord } from "@/state/features/game";
import { useDispatch } from "react-redux";
import { RaisedButton } from "@/components/ui/raised-button";
import { Timer } from "@/components/ui/timer";
import { HillScene } from "@/components/scenes/hill-scene";
export function PickingDrawerView() {
	const dispatch = useDispatch();
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	const wordOptions = useSelector((state: RootState) => state.game.wordOptions);
	return (
		<HillScene>
			<div className="absolute top-10 right-10">
				<Timer endTime={deadline} />
			</div>
			<div className="flex flex-col items-center justify-center my-auto gap-12">
				<h1 className="text-3xl font-bold">Pick a word</h1>
				<div className="flex items-center justify-center gap-8 px-4">
					{wordOptions.map((word) => (
						<RaisedButton
							size="lg"
							key={word}
							onClick={() => dispatch(selectWord(word))}
						>
							{word}
						</RaisedButton>
					))}
				</div>
			</div>
		</HillScene>
	);
}
