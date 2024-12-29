import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/state/store";
import { selectWord } from "@/state/features/game";
import { RaisedButton } from "@/components/ui/raised-button";
import { SkyScene } from "@/components/scenes/sky-scene";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { AnimatePresence } from "framer-motion";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
import { WordDifficulty } from "@/state/features/room";
import { cn } from "@/lib/utils";

const wordDifficultyColors: Record<WordDifficulty, string> = {
	[WordDifficulty.Easy]: "bg-green-500",
	[WordDifficulty.Medium]: "bg-yellow-500",
	[WordDifficulty.Hard]: "bg-red-500",
	[WordDifficulty.Random]: "bg-blue-500",
} as const;

// const wordDifficultyText: Record<WordDifficulty, string> = {
// 	[WordDifficulty.Easy]: "1.0x points",
// 	[WordDifficulty.Medium]: "1.5x points",
// 	[WordDifficulty.Hard]: "2.0x points",
// 	[WordDifficulty.Random]: "1.0x points",
// } as const;

export function PickingDrawerView() {
	const dispatch = useDispatch();
	const wordOptions = useSelector((state: RootState) => state.game.wordOptions);
	const isFirstPhase = useSelector(
		(state: RootState) => state.game.isFirstPhase
	);

	return (
		<SkyScene>
			<div className="flex flex-col items-center justify-center my-auto gap-12">
				<h1 className="text-3xl font-bold">Pick a word to sketch</h1>
				<div className="flex items-start justify-center lg:gap-8 gap-4 px-4 flex-wrap">
					{wordOptions.map((word) => (
						<div
							key={word.value}
							className="flex flex-col items-center gap-1.5"
						>
							<RaisedButton
								size="wide"
								onClick={() => dispatch(selectWord(word.value))}
							>
								<div className="relative z-10 font-semibold flex overflow-hidden w-full max-w-full h-11 rounded-lg -translate-y-0.5">
									{word.difficulty && (
										<div
											className={cn(
												"w-1.5 mr-auto h-12",
												wordDifficultyColors[word.difficulty]
											)}
										/>
									)}
									<span className="break-words overflow-wrap-anywhere w-full px-8 flex items-center justify-center h-full">
										{word.value}
									</span>
								</div>
							</RaisedButton>
							<p className="text-xs font-semibold text-muted-foreground flex flex-col items-center">
								<span className="capitalize text-sm !text-foreground">
									{word.difficulty}
								</span>
								{/* {isRandomDifficulty && wordDifficultyText[word.difficulty]} */}
							</p>
						</div>
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
					className="lg:w-36 w-28 absolute"
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
		</SkyScene>
	);
}
