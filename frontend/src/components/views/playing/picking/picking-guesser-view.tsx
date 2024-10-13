import { generateAvatar } from "@/lib/avatar";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { getPickingPlayer } from "@/lib/player";
import { Hills } from "@/components/hills";
import { Timer } from "@/components/timer";

export function PickingGuesserView() {
	const players = useSelector((state: RootState) => state.room.players);
	const pickingPlayer = getPickingPlayer(players);
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	if (!pickingPlayer) return null;
	const avatarSvg = generateAvatar(
		pickingPlayer.avatarSeed,
		pickingPlayer.avatarColor
	);

	return (
		<div className="flex h-full flex-col items-center justify-center w-full gap-8">
			<div className="absolute top-10 right-10">
				<Timer endTime={deadline} />
			</div>
			<img src={avatarSvg} className="w-20 h-20 rounded-lg shadow-accent" />
			<h1 className="text-3xl font-bold">
				{pickingPlayer.name} is picking a word
			</h1>
			<Hills />
			{/* so that hills still appear on the right when spring overshoots */}
			<Hills className="absolute bottom-0 left-full w-full " />
		</div>
	);
}
