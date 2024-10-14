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
} from "@/components/views";
import { createContext, useContext } from "react";
import { motion } from "framer-motion";
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
			direction: {
				enter: Direction.DOWN,
				exit: Direction.DOWN,
			},
		},
		[RoomRole.Player]: {
			Component: PreGamePlayerView,
			key: "pre-game-player",
			direction: {
				enter: Direction.DOWN,
				exit: Direction.DOWN,
			},
		},
	},
	[RoomStage.Playing]: {
		[GamePhase.Picking]: {
			[GameRole.Drawing]: {
				Component: PickingDrawerView,
				key: "playing-picking-drawer",
				direction: {
					enter: Direction.UP,
					exit: Direction.UP,
				},
			},
			[GameRole.Guessing]: {
				Component: PickingGuesserView,
				key: "playing-picking-guesser",
				direction: {
					enter: Direction.UP,
					exit: Direction.UP,
				},
			},
		},
		[GamePhase.Drawing]: {
			[GameRole.Drawing]: {
				Component: DrawingDrawerView,
				key: "playing-drawing-drawer",
				direction: {
					enter: Direction.RIGHT,
					exit: Direction.RIGHT,
				},
			},
			[GameRole.Guessing]: {
				Component: DrawingGuesserView,
				key: "playing-drawing-guesser",
				direction: {
					enter: Direction.RIGHT,
					exit: Direction.RIGHT,
				},
			},
		},
		[GamePhase.PostDrawing]: {
			Component: PostDrawingView,
			key: "playing-post-drawing",
			direction: {
				enter: Direction.LEFT,
				exit: Direction.LEFT,
			},
		},
	},
};

const variants = {
	initial: (direction: { enter: Direction; exit: Direction }) => {
		const isHorizontal =
			direction.enter === Direction.RIGHT || direction.enter === Direction.LEFT;
		return isHorizontal
			? {
					x: direction.enter === Direction.RIGHT ? "-100%" : "100%",
			  }
			: {
					y: direction.enter === Direction.DOWN ? "-100%" : "100%",
			  };
	},
	target: {
		x: "0%",
		y: "0%",
	},
	exit: (direction: { enter: Direction; exit: Direction }) => {
		const isHorizontal =
			direction.exit === Direction.RIGHT || direction.exit === Direction.LEFT;
		return isHorizontal
			? {
					x: direction.exit === Direction.RIGHT ? "100%" : "-100%",
			  }
			: {
					y: direction.exit === Direction.DOWN ? "100%" : "-100%",
			  };
	},
};

const DirectionContext = createContext<{
	enter: Direction;
	exit: Direction;
}>({ enter: Direction.RIGHT, exit: Direction.RIGHT });

type AnimatePresenceWithDirectionProps = {
	children: React.ReactNode;
	direction: { enter: Direction; exit: Direction };
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
	const { enter, exit } = useContext(DirectionContext);

	return {
		variants,
		custom: { enter, exit },
		initial: "initial",
		animate: "target",
		exit: "exit",
	};
};

const joinViews = {
	[JoinStage.EnterCode]: {
		Component: EnterCodeView,
		key: "join-enter-code",
		direction: { enter: Direction.RIGHT, exit: Direction.RIGHT },
	},
	[JoinStage.ChoosePlayerInfo]: {
		Component: EnterPlayerInfoView,
		key: "join-choose-player-info",
		direction: { enter: Direction.LEFT, exit: Direction.LEFT },
	},
};

function TransitionChild({ children }: { children: React.ReactNode }) {
	const animationProps = useDirectionAnimation();
	return (
		<motion.div className="absolute inset-0" {...animationProps}>
			{children}
		</motion.div>
	);
}

function App() {
	const roomStage = useSelector((state: RootState) => state.room.stage);
	const gamePhase = useSelector((state: RootState) => state.game.phase);
	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.client.id);
	const roomRole = players[playerId]?.roomRole;
	const gameRole = players[playerId]?.gameRole;

	const isFirstPhase = useSelector(
		(state: RootState) => state.game.isFirstPhase
	);

	const roomId = useSelector((state: RootState) => state.room.id);

	const RoomView = getView(roomViews, {
		roomStage,
		roomRole,
		gamePhase,
		gameRole,
		isFirstPhase,
	});

	const enteredRoomCode = useSelector(
		(state: RootState) => state.client.enteredRoomCode
	);

	const JoinView =
		joinViews[
			enteredRoomCode ? JoinStage.ChoosePlayerInfo : JoinStage.EnterCode
		];

	const direction = roomId ? RoomView.direction : JoinView.direction;

	return (
		<main className="flex min-h-screen flex-col items-center justify-between relative">
			<div className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden">
				<MotionConfig
					transition={{
						type: "spring",
						stiffness: 350,
						damping: 34,
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
							<TransitionChild key={RoomView.key}>
								<RoomView.Component />
							</TransitionChild>
						) : (
							<TransitionChild key={JoinView.key}>
								<JoinView.Component />
							</TransitionChild>
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
		isFirstPhase,
	}: {
		roomStage: RoomStage;
		roomRole: RoomRole;
		gamePhase: GamePhase;
		gameRole: GameRole;
		isFirstPhase: boolean;
	}
): {
	Component: React.ComponentType;
	key: string;
	direction: { enter: Direction; exit: Direction };
} {
	const stageView = viewsObj[roomStage];
	if (!stageView) {
		console.error(`Invalid room stage: ${roomStage}`);
		return {
			Component: () => null,
			key: "error",
			direction: { enter: Direction.LEFT, exit: Direction.LEFT },
		};
	}

	if (roomStage === RoomStage.Playing) {
		const phaseView = stageView[gamePhase];
		if (!phaseView) {
			console.error(`Invalid game phase: ${gamePhase}`);
			return {
				Component: () => null,
				key: "error",
				direction: { enter: Direction.LEFT, exit: Direction.LEFT },
			};
		}

		if (gamePhase === GamePhase.PostDrawing) {
			return phaseView;
		} else {
			const roleView = phaseView[gameRole];
			if (!roleView) {
				console.error(`Invalid game role: ${gameRole}`);
				return {
					Component: () => null,
					key: "error",
					direction: { enter: Direction.LEFT, exit: Direction.LEFT },
				};
			}
			if (!isFirstPhase) {
				return {
					...roleView,
					direction: { enter: Direction.LEFT, exit: Direction.LEFT },
				};
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
				direction: { enter: Direction.LEFT, exit: Direction.LEFT },
			};
		}

		return roleView;
	}
}

export default App;
