import "./App.css";
import { RoomRole, RoomStage } from "@/state/features/room";
import {
	AnimatePresence,
	AnimatePresenceProps,
	MotionConfig,
} from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { useSelector } from "react-redux";
import { RootState } from "./state/store";
import { GamePhase, GameRole } from "./state/features/game";
import {
	EnterCodeView,
	EnterPlayerInfoView,
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
import { createContext, useContext, useEffect, useState } from "react";

enum JoinStage {
	EnterCode = "EnterCode",
	ChoosePlayerInfo = "ChoosePlayerInfo",
}

enum Direction {
	UP,
	DOWN,
	LEFT,
	RIGHT,
}
const roomViews = {
	[RoomStage.PreGame]: {
		[RoomRole.Host]: {
			Component: PreGameHostView,
			key: "pre-game-host",
			direction: Direction.UP,
		},
		[RoomRole.Player]: {
			Component: PreGamePlayerView,
			key: "pre-game-player",
			direction: Direction.UP,
		},
	},
	[RoomStage.Playing]: {
		[GamePhase.Picking]: {
			[GameRole.Drawing]: {
				Component: PickingDrawerView,
				key: "playing-picking-drawer",
				direction: Direction.DOWN,
			},
			[GameRole.Guessing]: {
				Component: PickingGuesserView,
				key: "playing-picking-guesser",
				direction: Direction.DOWN,
			},
		},
		[GamePhase.Drawing]: {
			[GameRole.Drawing]: {
				Component: DrawingDrawerView,
				key: "playing-drawing-drawer",
				direction: Direction.RIGHT,
			},
			[GameRole.Guessing]: {
				Component: DrawingGuesserView,
				key: "playing-drawing-guesser",
				direction: Direction.RIGHT,
			},
		},
		[GamePhase.PostDrawing]: {
			Component: PostDrawingView,
			key: "playing-post-drawing",
			direction: Direction.RIGHT,
		},
	},
	[RoomStage.PostGame]: {
		[RoomRole.Host]: {
			Component: PostGameHostView,
			key: "post-game-host",
			direction: Direction.UP,
		},
		[RoomRole.Player]: {
			Component: PostGamePlayerView,
			key: "post-game-player",
			direction: Direction.UP,
		},
	},
};

const variants = {
	initial: (direction: Direction) => ({
		x:
			direction === Direction.RIGHT || direction === Direction.LEFT
				? direction === Direction.RIGHT
					? "100%"
					: "-100%"
				: "0%",
		y:
			direction === Direction.UP || direction === Direction.DOWN
				? direction === Direction.DOWN
					? "100%"
					: "-100%"
				: "0%",
	}),
	target: {
		x: "0%",
		y: "0%",
	},
	exit: (direction: Direction) => ({
		x:
			direction === Direction.RIGHT || direction === Direction.LEFT
				? direction === Direction.RIGHT
					? "-100%"
					: "100%"
				: "0%",
		y:
			direction === Direction.UP || direction === Direction.DOWN
				? direction === Direction.DOWN
					? "-100%"
					: "100%"
				: "0%",
	}),
};

const DirectionContext = createContext<Direction>(Direction.RIGHT);

type AnimatePresenceWithDirectionProps = {
	children: React.ReactNode;
	direction: Direction;
} & Omit<AnimatePresenceProps, "custom">;

const AnimatePresenceWithDirection = ({
	children,
	direction,
	...props
}: AnimatePresenceWithDirectionProps) => {
	return (
		<DirectionContext.Provider value={direction}>
			<AnimatePresence {...props} custom={direction}>
				{children}
			</AnimatePresence>
		</DirectionContext.Provider>
	);
};

export const useDirectionAnimation = () => {
	const direction = useContext(DirectionContext);

	return {
		variants,
		custom: direction,
		initial: "initial",
		animate: "target",
		exit: "exit",
	};
};

const joinViews = {
	[JoinStage.EnterCode]: {
		Component: EnterCodeView,
		key: "join-enter-code",
		direction: Direction.LEFT,
	},
	[JoinStage.ChoosePlayerInfo]: {
		Component: EnterPlayerInfoView,
		key: "join-choose-player-info",
		direction: Direction.RIGHT,
	},
};

function App() {
	const roomStage = useSelector((state: RootState) => state.room.stage);
	const gamePhase = useSelector((state: RootState) => state.game.phase);
	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.client.id);
	const roomRole = players[playerId]?.roomRole;
	const gameRole = players[playerId]?.gameRole;

	const [isFirstPickingPhase, setIsFirstPickingPhase] = useState(true);

	const roomId = useSelector((state: RootState) => state.room.id);

	const RoomView = getView(roomViews, {
		roomStage,
		roomRole,
		gamePhase,
		gameRole,
		isFirstPickingPhase,
	});

	// Hack to get the picking phase to slide right
	// On game start, we slide down from the room view, afterwards it slides right
	useEffect(() => {
		if (
			isFirstPickingPhase &&
			roomStage === RoomStage.Playing &&
			gamePhase === GamePhase.Picking
		) {
			console.log("setting first picking phase");
			setIsFirstPickingPhase(false);
		}

		if (roomStage === RoomStage.PostGame) {
			setIsFirstPickingPhase(true);
		}
	}, [roomStage, gamePhase, isFirstPickingPhase]);

	const enteredRoomCode = useSelector(
		(state: RootState) => state.client.enteredRoomCode
	);

	const clientId = useSelector((state: RootState) => state.client.id);
	const direction = clientId
		? RoomView.direction
		: enteredRoomCode
		? Direction.RIGHT
		: Direction.LEFT;

	const JoinView =
		joinViews[
			enteredRoomCode ? JoinStage.ChoosePlayerInfo : JoinStage.EnterCode
		];

	return (
		<main className="flex min-h-screen flex-col items-center justify-between relative">
			<div className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden">
				<MotionConfig
					transition={{
						type: "spring",
						stiffness: 500,
						damping: 50,
						mass: 1,
						restDelta: 0.01,
					}}
				>
					<AnimatePresenceWithDirection
						initial={false}
						mode="sync"
						direction={direction}
					>
						{roomId ? (
							<RoomView.Component key={RoomView.key} />
						) : (
							<JoinView.Component key={JoinView.key} />
						)}
					</AnimatePresenceWithDirection>
				</MotionConfig>
			</div>
			<Toaster
				offset={16}
				className="Toaster"
				toastOptions={{
					classNames: {
						toast: "px-4 py-2 !font-bold",
					},
					style: {
						boxShadow: "-4px 4px 0px #333333",
						fontFamily: "Nokora",
						fontWeight: "600",
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
		isFirstPickingPhase,
	}: {
		roomStage: RoomStage;
		roomRole: RoomRole;
		gamePhase: GamePhase;
		gameRole: GameRole;
		isFirstPickingPhase: boolean;
	}
): {
	Component: React.ComponentType;
	key: string;
	direction: Direction;
} {
	const stageView = viewsObj[roomStage];
	if (!stageView) {
		console.error(`Invalid room stage: ${roomStage}`);
		return { Component: () => null, key: "error", direction: Direction.RIGHT };
	}

	if (roomStage === RoomStage.Playing) {
		const phaseView = stageView[gamePhase];
		if (!phaseView) {
			console.error(`Invalid game phase: ${gamePhase}`);
			return {
				Component: () => null,
				key: "error",
				direction: Direction.RIGHT,
			};
		}

		if (gamePhase === GamePhase.PostDrawing) {
			return phaseView;
		} else {
			let roleView = phaseView[gameRole];
			if (!roleView) {
				console.error(`Invalid game role: ${gameRole}`);
				return {
					Component: () => null,
					key: "error",
					direction: Direction.RIGHT,
				};
			}
			if (!isFirstPickingPhase) {
				roleView = { ...roleView, direction: Direction.RIGHT };
			}
			return roleView;
		}
	} else {
		const roleView = stageView[roomRole];
		if (!roleView) {
			console.error(`Invalid room role: ${roomRole}`);
			return {
				Component: () => null,
				key: "error",
				direction: Direction.RIGHT,
			};
		}
		return roleView;
	}
}

export default App;
