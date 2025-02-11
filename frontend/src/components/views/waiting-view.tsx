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
import { AnimatePresence } from "motion/react";
import { RoomRole } from "@/state/features/room";
import { RoomSettingsForm } from "./components/room-settings-form";
import { Chat } from "./components/chat";

export function WaitingView() {
	const [showSettings, setShowSettings] = useState(false);

	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.room.playerId);
	const roomId = useSelector((state: RootState) => state.room.id);

	const role = getRoomRole(playerId, players);

	const dispatch = useDispatch();

	return (
		<RoomScene>
			<div className="relative z-10 max-w-3xl w-full flex flex-col items-end gap-2 p-2.5 lg:px-0 h-full lg:h-auto">
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
					<div className="ml-auto flex items-center gap-2.5">
						{role === RoomRole.Host && (
							<RaisedButton
								id="start-game-button"
								data-umami-event="Start game"
								size="lg"
								variant="action"
								className="text-lg"
								onClick={() => dispatch({ type: "game/start" })}
							>
								Start game
							</RaisedButton>
						)}
						<div className="lg:hidden">
							<ModalMenu />
						</div>
					</div>
				</div>
				<div className="w-full lg:aspect-[4/3] flex-1 flex items-start justify-center lg:max-h-[calc(100vh-200px)]">
					{showSettings ? (
						<div className="flex-1 bg-background-secondary/50 backdrop-blur-sm border-4 border-border rounded-lg flex flex-col p-3 lg:max-h-[calc(100vh-200px)] max-h-[calc(100vh-70px)] overflow-y-auto gap-1.5">
							<h1 className="text-2xl font-bold z-10 leading-none">
								Room settings
							</h1>
							<RoomSettingsForm />
						</div>
					) : (
						<div className="flex h-full gap-2 flex-1 lg:flex-row flex-col">
							<div className="flex-1 bg-background-secondary/50 backdrop-blur-sm border-4 border-border rounded-lg flex flex-col p-2 lg:p-2.5 lg:max-h-[calc(100vh-200px)] max-h-[50%] gap-4">
								<h1 className="lg:text-2xl text-xl font-bold z-10 leading-none">
									Players
								</h1>
								<ul className="flex flex-col w-full lg:gap-4 gap-2 ">
									<AnimatePresence initial={false} mode="popLayout">
										{Object.values(players)
											.sort((a, b) => b.score - a.score)
											.map((player) => (
												<PlayerCard key={player.id} player={player} />
											))}
									</AnimatePresence>
								</ul>
							</div>
							<div className="flex-1 bg-background-secondary/50 backdrop-blur-sm border-4 border-border rounded-xl flex flex-col lg:w-[22rem] w-fill lg:h-full h-auto relative overflow-hidden">
								<div className="w-full bg-gradient-to-b from-background-secondary via-background-secondary to-background-transparent absolute top-0 left-0 lg:h-12 h-10 z-50 flex items-center px-2">
									<h1 className="lg:text-2xl text-xl font-bold z-10 leading-none">
										Chat
									</h1>
								</div>
								<Chat placeholder="Type your message..." />
							</div>
						</div>
					)}
				</div>
			</div>
		</RoomScene>
	);
}
