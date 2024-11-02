import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { selectWord } from "@/state/features/game";
import { useDispatch } from "react-redux";
import { RaisedButton } from "@/components/ui/raised-button";
import { Timer } from "@/components/ui/timer";
import { HillScene } from "@/components/scenes/hill-scene";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { AnimatePresence } from "framer-motion";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
export function PickingDrawerView() {
	const dispatch = useDispatch();
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	const wordOptions = useSelector((state: RootState) => state.game.wordOptions);
	const isFirstPhase = useSelector(
		(state: RootState) => state.game.isFirstPhase
	);
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
			<AnimatePresence>
				<BobbingDoodle
					duration={4}
					style={{ top: "20%", left: "12%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					duration={5}
					style={{ top: "8%", left: "20%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					duration={4.5}
					style={{ top: "10%", right: "10%" }}
					src="/doodles/rain-cloud.png"
				/>
			</AnimatePresence>

			<AirplaneDoodle
				skipTransition={!isFirstPhase}
				startAt={{ left: "-15%", top: "75%", rotate: 40 }}
				animateTo={{ left: "45%", top: "65%", rotate: 30 }}
				leaveTo={{ left: "105%", top: "55%", rotate: 30 }}
			/>
		</HillScene>
	);
}
