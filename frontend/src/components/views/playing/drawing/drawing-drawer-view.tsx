import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import Canvas from "@/components/canvas";
import { CanvasTools, ColorSliders } from "@/components/canvas-tools";
import { GameRole } from "@/state/features/game";
import { Guesses } from "./guesses";
import { Timer } from "@/components/timer";
import { HillScene } from "@/components/scenes/hill-scene";
export function DrawingDrawerView() {
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	const selectedWord = useSelector(
		(state: RootState) => state.game.selectedWord
	);

	return (
		<HillScene>
			<div className="mx-auto my-auto flex flex-col gap-2 items-center relative z-50">
				<div className="flex w-full h-full items-end justify-center gap-6">
					<div className="py-16">
						<ColorSliders />
					</div>
					<div className="flex flex-col items-center justify-center w-[800px]">
						<div className="flex justify-between w-full items-center py-2">
							<div className="text-2xl">
								You're drawing:{" "}
								<span className="text-3xl font-bold">{selectedWord}</span>
							</div>
							<Timer endTime={deadline} />
						</div>
						<Canvas width={800} height={600} role={GameRole.Drawing} />
						<CanvasTools />
					</div>
					<Guesses />
				</div>
			</div>
		</HillScene>
	);
}
