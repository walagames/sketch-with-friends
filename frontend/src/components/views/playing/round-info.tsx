import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
// import { UsersIcon } from "lucide-react";

export function RoundInfo() {
	const currentRound = useSelector(
		(state: RootState) => state.game.currentRound
	);
	const totalRounds = useSelector(
		(state: RootState) => state.room.settings.totalRounds
	);
	// const players = useSelector((state: RootState) => state.room.players);
	return (
		<div className="flex gap-4 lg:hidden">
			<div className="flex gap-2 font-bold items-center relative text-sm -mb-0.5">
				Round {currentRound} of {totalRounds}
				{/* <div className="flex gap-1.5 font-bold items-center relative text-sm">
					<UsersIcon className="size-4 mb-1" /> {Object.keys(players).length}
				</div> */}
			</div>
		</div>
	);
}
