import { PlayerCards } from "./player-cards";
import { useDispatch } from "react-redux";
import { copyInviteLink } from "@/lib/realtime";
import { RaisedButton } from "@/components/ui/raised-button";
import { useState } from "react";
import { LinkIcon, SettingsIcon, UsersIcon } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { RoomSettingsForm } from "./room-settings-form";
export function RoomPane({ isHost }: { isHost: boolean }) {
	const players = useSelector((state: RootState) => state.room.players);
	const roomId = useSelector((state: RootState) => state.room.id);

	const [showSettings, setShowSettings] = useState(false);

	const settings = useSelector((state: RootState) => state.room.settings);

	const dispatch = useDispatch();
	return (
		<div className="relative z-10 max-w-3xl w-full flex flex-col items-end gap-4 p-2.5 lg:px-0 h-full lg:h-auto">
			<div className="flex gap-6 items-center w-full">
				<div>
					<RaisedButton
						size="lg"
						className="group w-40"
						onClick={() => copyInviteLink(roomId)}
					>
						<span className="lg:group-hover:block hidden">
							Copy invite link
						</span>
						<span className="flex items-center gap-2 lg:group-hover:hidden text-lg">
							<LinkIcon className="w-5 h-5 mb-1" />
							{roomId}
						</span>
					</RaisedButton>
				</div>
				<span className="font-bold text-xl flex items-center gap-2">
					<UsersIcon className="w-5 h-5 mb-1" />
					{Object.keys(players).length}/{settings.playerLimit}
				</span>
				{/* <span className="font-bold text-xl flex items-center gap-2">
					<Tally5Icon className="w-5 h-5 mb-1" />
					{settings.totalRounds}
				</span>
				<span className="font-bold text-xl flex items-center gap-1.5">
					<ClockIcon className="w-5 h-5 mb-1" />
					{settings.drawingTimeAllowed}s
				</span> */}
				{isHost && (
					<div className="ml-auto">
						<RaisedButton
							variant="action"
							size="icon"
							onClick={() => setShowSettings(!showSettings)}
						>
							{showSettings ? <UsersIcon /> : <SettingsIcon />}
						</RaisedButton>
					</div>
				)}
			</div>
			<div className="w-full lg:aspect-[4/3] flex-1 bg-[#aef1fe]/50 backdrop-blur-sm border-4 border-border border-dashed rounded-lg flex items-start justify-center lg:p-6 px-4 pt-2">
				{showSettings ? (
					<RoomSettingsForm />
				) : (
					<PlayerCards players={Object.values(players)} />
				)}
			</div>
			{isHost && (
				<div>
					<RaisedButton
						data-m:click={
							Object.keys(players).length > 1 && "action=start_game"
						}
						size="xl"
						variant="action"
						onClick={() => dispatch({ type: "game/startGame" })}
					>
						Start game
					</RaisedButton>
				</div>
			)}
		</div>
	);
}
