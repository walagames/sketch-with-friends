import { PlayerCards } from "./player-cards";
import { useDispatch } from "react-redux";
import { copyRoomLink } from "@/lib/realtime";
import { RaisedButton } from "@/components/ui/raised-button";
import { useState } from "react";
import {
	ClockIcon,
	LinkIcon,
	SettingsIcon,
	Tally5Icon,
	UsersIcon,
} from "lucide-react";
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
		<div className="max-w-3xl w-full flex flex-col items-end gap-4">
			<div className="flex gap-6 items-center w-full">
				<div>
					<RaisedButton
						size="lg"
						className="group w-40"
						onClick={() => copyRoomLink(roomId)}
					>
						<span className="group-hover:block hidden">Copy room link</span>
						<span className="flex items-center gap-2 group-hover:hidden text-lg">
							<LinkIcon className="w-5 h-5 mb-1" />
							{roomId}
						</span>
					</RaisedButton>
				</div>
				<span className="font-bold text-xl flex items-center gap-2">
					<UsersIcon className="w-5 h-5 mb-1" />
					{Object.keys(players).length}/{settings.playerLimit}
				</span>
				<span className="font-bold text-xl flex items-center gap-2">
					<Tally5Icon className="w-5 h-5 mb-1" />
					{settings.totalRounds}
				</span>
				<span className="font-bold text-xl flex items-center gap-1.5">
					<ClockIcon className="w-5 h-5 mb-1" />
					{settings.drawingTimeAllowed}s
				</span>
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
			<div className="w-full aspect-[4/3] bg-zinc-400/10 border-4 border-border border-dashed rounded-lg flex items-start justify-center py-6 px-6">
				{showSettings ? (
					<RoomSettingsForm />
				) : (
					<PlayerCards players={Object.values(players)} />
				)}
			</div>
			{isHost && (
				<div>
					<RaisedButton
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
