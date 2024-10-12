import CountdownTimer from "@/components/countdown-timer";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { selectWord } from "@/state/features/game";
import { useDispatch } from "react-redux";
import { useDirectionAnimation } from "@/App";
import { motion } from "framer-motion";
import { Hills } from "@/components/hills";
import { RaisedButton } from "@/components/raised-button";
export function PickingDrawerView() {
	const directionProps = useDirectionAnimation();
	const dispatch = useDispatch();
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	const wordOptions = useSelector((state: RootState) => state.game.wordOptions);
	return (
		<motion.div
			{...directionProps}
			className="flex h-full flex-col items-center justify-center w-full absolute inset-0"
		>
			<div className="absolute top-10 right-10">
				<CountdownTimer key={deadline} endTime={new Date(deadline).getTime()} />
			</div>
			<div className="flex flex-col items-center justify-center my-auto gap-12">
				<h1 className="text-3xl font-bold">Pick a word to sketch</h1>
				<div className="flex items-center justify-center gap-8">
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
			<Hills />
		</motion.div>
	);
}
