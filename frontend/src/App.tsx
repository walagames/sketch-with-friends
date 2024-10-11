import "./App.css";
import { RoomRole, RoomStage } from "@/state/features/room";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { useSelector } from "react-redux";
import { RootState } from "./state/store";
import { GamePhase, GameRole } from "./state/features/game";
import {
	JoinRoomView,
	PreGameHostView,
	PreGamePlayerView,
	PickingDrawerView,
	PickingGuesserView,
	DrawingDrawerView,
	DrawingGuesserView,
	PostDrawingView,
	PostGameHostView,
	PostGamePlayerView,
} from "@/components/views";
import { GameStartCountdown } from "./components/game-start-countdown";
import { PlayerCards } from "./components/player-card";
import { Button } from "./components/ui/button";
import { LinkIcon } from "lucide-react";
import { copyRoomLink } from "./lib/realtime";

const views = {
	[RoomStage.PreGame]: {
		[RoomRole.Host]: {
			Component: PreGameHostView,
			key: "pre-game-host",
		},
		[RoomRole.Player]: {
			Component: PreGamePlayerView,
			key: "pre-game-player",
		},
	},
	[RoomStage.Playing]: {
		[GamePhase.Picking]: {
			[GameRole.Drawing]: {
				Component: PickingDrawerView,
				key: "playing-picking-drawer",
			},
			[GameRole.Guessing]: {
				Component: PickingGuesserView,
				key: "playing-picking-guesser",
			},
		},
		[GamePhase.Drawing]: {
			[GameRole.Drawing]: {
				Component: DrawingDrawerView,
				key: "playing-drawing-drawer",
			},
			[GameRole.Guessing]: {
				Component: DrawingGuesserView,
				key: "playing-drawing-guesser",
			},
		},
		[GamePhase.PostDrawing]: {
			Component: PostDrawingView,
			key: "playing-post-drawing",
		},
	},
	[RoomStage.PostGame]: {
		[RoomRole.Host]: {
			Component: PostGameHostView,
			key: "post-game-host",
		},
		[RoomRole.Player]: {
			Component: PostGamePlayerView,
			key: "post-game-player",
		},
	},
};

function App() {
	const roomStage = useSelector((state: RootState) => state.room.stage);
	const gamePhase = useSelector((state: RootState) => state.game.phase);
	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.client.id);
	const roomRole = players[playerId]?.roomRole;
	const gameRole = players[playerId]?.gameRole;

	const roomId = useSelector((state: RootState) => state.room.id);

	const View = getView(views, { roomStage, roomRole, gamePhase, gameRole });

	return (
		<main className="flex min-h-screen flex-col items-center justify-between relative">
			<div className="h-screen w-screen flex flex-col items-center justify-center relative p-3">
				<AnimatePresence mode="popLayout">
					{roomId ? (
						<motion.div
							key={View.key}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{
								type: "spring",
								stiffness: 500,
								damping: 50,
								mass: 1,
							}}
							className="h-full w-full flex flex-col items-center justify-between relative"
						>
							<div className="flex justify-between w-full">
								<PlayerCards players={Object.values(players)} />
								<Button
									onClick={() => copyRoomLink(roomId)}
									variant="outline"
									size="icon"
								>
									<LinkIcon className="w-5 h-5" />
								</Button>
							</div>
							<div className="my-auto">
								<View.Component />
							</div>
						</motion.div>
					) : (
						<JoinRoomView />
					)}
				</AnimatePresence>
			</div>
			<Toaster
				offset={16}
				className="Toaster"
				toastOptions={{
					classNames: {
						toast: "px-4 py-2 ",
					},
				}}
				position="top-center"
			/>
		</main>
	);
}

function getView(
	viewsObj: any,
	{
		roomStage,
		roomRole,
		gamePhase,
		gameRole,
	}: {
		roomStage: RoomStage;
		roomRole: RoomRole;
		gamePhase: GamePhase;
		gameRole: GameRole;
	}
): {
	Component: React.ComponentType;
	key: string;
} {
	const stageView = viewsObj[roomStage];
	if (!stageView) {
		console.error(`Invalid room stage: ${roomStage}`);
		return { Component: () => null, key: "error" };
	}

	if (roomStage === RoomStage.Playing) {
		const phaseView = stageView[gamePhase];
		if (!phaseView) {
			console.error(`Invalid game phase: ${gamePhase}`);
			return { Component: () => null, key: "error" };
		}

		if (gamePhase === GamePhase.PostDrawing) {
			return phaseView;
		} else {
			const roleView = phaseView[gameRole];
			if (!roleView) {
				console.error(`Invalid game role: ${gameRole}`);
				return { Component: () => null, key: "error" };
			}
			return roleView;
		}
	} else {
		const roleView = stageView[roomRole];
		if (!roleView) {
			console.error(`Invalid room role: ${roomRole}`);
			return { Component: () => null, key: "error" };
		}
		return roleView;
	}
}

export default App;
