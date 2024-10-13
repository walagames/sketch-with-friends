import CountdownTimer from "@/components/countdown-timer";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import Canvas from "@/components/canvas";
import { CanvasTools, ColorSliders } from "@/components/canvas-tools";
import { GameRole } from "@/state/features/game";
import { Hills } from "@/components/hills";
import { Guesses } from "./guesses";

export function DrawingDrawerView() {
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	const selectedWord = useSelector(
		(state: RootState) => state.game.selectedWord
	);

	return (
		<div className="flex h-full flex-col items-center justify-center w-full">
			<div className="mx-auto my-auto flex flex-col gap-2 items-center relative z-50">
				<div className="flex w-full h-full items-end justify-center gap-6">
					<div className="py-16">
						<ColorSliders />
					</div>
					<div className="flex flex-col items-center justify-center gap-4 w-[800px]">
						<div className="flex justify-between w-full items-end">
							<div className="text-2xl">
								You're drawing:{" "}
								<span className="text-3xl font-bold">{selectedWord}</span>
							</div>
							<CountdownTimer
								key={deadline}
								endTime={new Date(deadline).getTime()}
							/>
						</div>
						<Canvas width={800} height={600} role={GameRole.Drawing} />
						<CanvasTools />
					</div>
					<Guesses />
				</div>
			</div>
			<Hills />
			{/* so that hills still appear on the left when spring overshoots */}
			<Hills className="absolute bottom-0 left-full w-full" />
		</div>
	);
}
