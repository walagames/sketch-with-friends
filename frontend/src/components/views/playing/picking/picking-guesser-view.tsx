import { generateAvatar } from "@/lib/avatar";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { getPickingPlayer } from "@/lib/player";

export function PickingGuesserView() {
	const players = useSelector((state: RootState) => state.room.players);
	const pickingPlayer = getPickingPlayer(players);
	if (!pickingPlayer) return null;
	const avatarSvg = generateAvatar(
		pickingPlayer.avatarSeed,
		pickingPlayer.avatarColor
	);
	return (
		<div className="flex flex-col items-center justify-center gap-2">
			<img src={avatarSvg} className="w-20 h-20 rounded-full" />
			<h1 className="text-2xl font-medium">
				{pickingPlayer.name} is picking a word
			</h1>
		</div>
	);
}
