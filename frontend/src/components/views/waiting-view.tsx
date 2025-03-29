import { RoomScene } from "@/components/scenes/room-scene";
import { getRoomRole } from "@/lib/player";
import { PlayerCard } from "@/components/views/components/player-card";
import { useDispatch, useSelector } from "react-redux";
import { copyInviteLink } from "@/lib/realtime";
import { RaisedButton } from "@/components/ui/raised-button";
import { useState } from "react";
import {
	LinkIcon,
	MessageCircleIcon,
	PlayIcon,
	SettingsIcon,
	UsersIcon,
} from "lucide-react";
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
	const roomSettings = useSelector((state: RootState) => state.room.settings);
	const role = getRoomRole(playerId, players);

	const dispatch = useDispatch();

	return (
		<RoomScene>
			<div className="relative z-10 max-w-3xl w-full flex flex-col items-end gap-2 p-2.5 lg:px-0 h-full lg:h-auto">
				<div className="flex gap-3 items-center w-full">
					<div>
						<RaisedButton
							size="lg"
							className="group lg:w-40 w-32"
							onClick={() => copyInviteLink(roomId)}
						>
							<span className="flex items-center gap-2 text-lg">
								<LinkIcon className="size-4 mb-1" />
								Invite
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
								className="group lg:w-40 w-36"
								onClick={() => dispatch({ type: "game/start" })}
							>
								<span className="flex items-center gap-2 text-lg">
									<PlayIcon className="size-4 mb-1" />
									Start
								</span>
							</RaisedButton>
						)}
						<div className="lg:hidden">
							<ModalMenu />
						</div>
					</div>
				</div>
				<div className="w-full lg:aspect-[4/3] flex-1 flex items-start justify-center lg:max-h-[calc(100vh-200px)] backdrop-blur-sm border-4 border-border border-dashed rounded-lg">
					{showSettings ? (
						<div className="flex-1 lg:bg-background-secondary/50 bg-background-secondary flex flex-col p-4 lg:max-h-[calc(100vh-200px)] max-h-[calc(100vh-100px)] overflow-y-auto gap-1.5">
							<h1 className="lg:text-2xl text-xl font-bold z-10 leading-none flex items-center gap-1.5">
								{/* <SettingsIcon className="size-6 -translate-y-0.5" /> */}
								Room settings
							</h1>
							<RoomSettingsForm />
						</div>
					) : (
						<div className="flex h-full gap-2 flex-1 lg:flex-row flex-col lg:divide-x-4 lg:divide-y-0 divide-y-4 divide-border divide-dashed">
							<div className="flex-1 lg:bg-background-secondary/50 bg-background-secondary flex flex-col p-4 lg:p-4 lg:max-h-[calc(100vh-200px)] max-h-[50%] gap-4 overflow-y-auto">
								{/* <div className="flex items-center gap-2">
									<h1 className="lg:text-xl text-lg font-bold z-10 leading-none flex items-center gap-2">
										<UsersIcon className="size-6 -translate-y-0.5" />
										Players
										<span className="text-xl">
											{Object.keys(players).length}/{roomSettings.playerLimit}
										</span>
									</h1>
								</div> */}
								<div className="bg-gradient-to-b from-background-secondary via-background-secondary/80 to-background-transparent absolute top-0 left-0 lg:h-12 h-10 z-50 flex items-center px-4 lg:p-4 lg:py-7">
									<h1 className="lg:text-2xl text-xl font-bold z-10 leading-none flex items-center gap-1.5">
										{/* <UsersIcon className="size-6 -translate-y-0.5" /> */}
										Players
										<span className="">
											{Object.keys(players).length}/{roomSettings.playerLimit}
										</span>
									</h1>
								</div>
								<ul className="flex flex-col w-full lg:gap-4 gap-3 px-1 lg:pt-10 pt-6">
									<AnimatePresence initial={false} mode="popLayout">
										{Object.values(players)
											.sort((a, b) => b.score - a.score)
											.map((player) => (
												<PlayerCard key={player.id} player={player} />
											))}
									</AnimatePresence>
								</ul>
							</div>
							<div className="flex-1 bg-background-secondary/50  flex flex-col lg:w-[22rem] w-fill lg:h-full h-auto relative overflow-hidden p-1.5">
								<div className="w-full bg-gradient-to-b from-background-secondary via-background-secondary/80 to-background-transparent absolute top-0 left-0 lg:h-12 h-10 z-50 flex items-center px-4 lg:p-4 lg:py-7">
									<h1 className="lg:text-2xl text-xl font-bold z-10 leading-none flex items-center gap-1.5">
										{/* <MessageCircleIcon className="size-6 -translate-y-0.5" /> */}
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
