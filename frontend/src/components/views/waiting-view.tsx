import { RoomScene } from "@/components/scenes/room-scene";
import { getRoomRole } from "@/lib/player";
import { PlayerCard } from "@/components/views/components/player-card";
import { useDispatch, useSelector } from "react-redux";
import { copyInviteLink } from "@/lib/realtime";
import { RaisedButton } from "@/components/ui/raised-button";
import { useState } from "react";
import { LinkIcon, SettingsIcon, UsersIcon } from "lucide-react";
import { RootState } from "@/state/store";
import { ModalMenu } from "@/components/ui/modal-menu";
import { AnimatePresence } from "framer-motion";
import { RoomRole } from "@/state/features/room";
import { RoomSettingsForm } from "./components/room-settings-form";

export function WaitingView() {
	const [showSettings, setShowSettings] = useState(false);

	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.room.playerId);
	const settings = useSelector((state: RootState) => state.room.settings);
	const roomId = useSelector((state: RootState) => state.room.id);

	const role = getRoomRole(playerId, players);

	const dispatch = useDispatch();

	return (
		<RoomScene>
			<div className="relative z-10 max-w-3xl w-full flex flex-col items-end gap-4 p-2.5 lg:px-0 h-full lg:h-auto">
				<div className="flex gap-3 items-center w-full">
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
					<div className="ml-auto flex items-center gap-2.5">
						{role === RoomRole.Host && (
							<RaisedButton
								size="icon"
								onClick={() => setShowSettings(!showSettings)}
							>
								{showSettings ? (
									<UsersIcon className="size-5 -translate-y-0.5" />
								) : (
									<SettingsIcon className="size-5 -translate-y-0.5" />
								)}
							</RaisedButton>
						)}
						<div className="lg:hidden">
							<ModalMenu />
						</div>
					</div>
				</div>
				<div className="w-full lg:aspect-[4/3] flex-1 bg-background-secondary/50 backdrop-blur-sm border-4 border-border border-dashed rounded-lg flex items-start justify-center lg:p-6 px-4 pt-2 max-h-[calc(100vh-200px)] overflow-y-auto">
					{showSettings ? (
						<RoomSettingsForm />
					) : (
						<ul className="lg:gap-4 gap-3 grid lg:grid-cols-2 w-full lg:w-auto py-2">
							<AnimatePresence initial={false} mode="popLayout">
								{Object.values(players)
									.sort((a, b) => b.score - a.score)
									.map((player) => (
										<PlayerCard key={player.id} player={player} />
									))}
							</AnimatePresence>
						</ul>
					)}
				</div>
				{role === RoomRole.Host && (
					<div>
						<RaisedButton
							id="start-game-button"
							data-umami-event="Start game"
							size="xl"
							variant="action"
							onClick={() => dispatch({ type: "game/start" })}
						>
							Start game
						</RaisedButton>
					</div>
				)}
			</div>
		</RoomScene>
	);
}
