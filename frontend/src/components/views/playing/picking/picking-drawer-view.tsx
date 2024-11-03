import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/state/store";
import { selectWord } from "@/state/features/game";
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
			<div className="absolute lg:top-10 lg:right-10 top-4 right-4">
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
					hideOnSmallViewports
					duration={4}
					style={{ top: "20%", left: "12%" }}
					src="/doodles/rain-cloud.png"
					key="rain-cloud-1"
				/>
				<BobbingDoodle
					duration={5}
					style={{ top: "8%", left: "20%" }}
					src="/doodles/rain-cloud.png"
					key="rain-cloud-2"
				/>
				<BobbingDoodle
					hideOnSmallViewports
					duration={4.5}
					style={{ top: "12%", right: "10%" }}
					src="/doodles/rain-cloud.png"
					key="rain-cloud-3"
				/>
			</AnimatePresence>

			<AirplaneDoodle
				skipTransition={!isFirstPhase}
				startAt={
					isFirstPhase
						? { left: "-15%", top: "55%", rotate: 20, opacity: 0 }
						: { left: "45%", top: "65%", rotate: 30, opacity: 0 }
				}
				animateTo={{ left: "45%", top: "65%", rotate: 30, opacity: 1 }}
				leaveTo={{ left: "185%", top: "55%", rotate: 30 }}
			/>
		</HillScene>
	);
}
