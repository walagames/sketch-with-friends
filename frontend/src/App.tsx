import "./App.css";
import { RoomRole, RoomStage } from "@/state/features/room";
import { Toaster } from "@/components/ui/sonner";
import { useSelector } from "react-redux";
import { RootState } from "./state/store";
import { GamePhase, GameRole } from "./state/features/game";
import {
	AnimatePresenceWithDirection,
	Direction,
} from "@/components/animation/direction-context";
import { TransitionContainer } from "@/components/animation/transition-container";
import { MotionConfig } from "framer-motion";
import {
	EnterCodeView,
	EnterPlayerInfoView,
	PickingDrawerView,
	PickingGuesserView,
	PostDrawingView,
	DrawingView,
	PreGameView,
} from "@/components/views";
import { useEffect, useState } from "react";
import { containerSpring } from "@/config/spring";
type ViewComponent = {
	Component: React.ComponentType;
	key: string;
	transition: Direction;
};

const joinViews: Record<string, ViewComponent> = {
	EnterCode: {
		Component: EnterCodeView,
		key: "join-enter-code",
		transition: Direction.RIGHT,
	},
	ChoosePlayerInfo: {
		Component: EnterPlayerInfoView,
		key: "join-choose-player-info",
		transition: Direction.LEFT,
	},
};

const roomViews = {
	[RoomStage.PreGame]: {
		Component: PreGameView,
		key: "pre-game",
		transition: Direction.UP,
	},
	[RoomStage.Playing]: {
		[GamePhase.Picking]: {
			[GameRole.Drawing]: {
				Component: PickingDrawerView,
				key: "playing-picking-drawer",
				transition: Direction.LEFT,
			},
			[GameRole.Guessing]: {
				Component: PickingGuesserView,
				key: "playing-picking-guesser",
				transition: Direction.LEFT,
			},
		},
		[GamePhase.Drawing]: {
			Component: DrawingView,
			key: "playing-drawing",
			transition: Direction.LEFT,
		},
		[GamePhase.PostDrawing]: {
			Component: PostDrawingView,
			key: "playing-post-drawing",
			transition: Direction.LEFT,
		},
		[GamePhase.Unanimous]: {
			Component: () => <></>,
			key: "unanimous",
			transition: Direction.LEFT,
		},
	},
	[RoomStage.Unanimous]: {
		Component: () => <></>,
		key: "unanimous",
		transition: Direction.LEFT,
	},
} as const;

function roomView({
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
}): ViewComponent {
	if (roomStage === RoomStage.Playing) {
		const phaseView = roomViews[RoomStage.Playing][gamePhase];
		if ("Component" in phaseView) {
			return phaseView;
		}

		const view = phaseView[gameRole];
		return isFirstPhase ? { ...view, transition: Direction.DOWN_FADE } : view;
	}

	const view = roomViews[roomStage];
	if ("Component" in view) {
		return view;
	}
	return view[roomRole];
}

function joinView(enteredRoomCode: string): ViewComponent {
	return joinViews[enteredRoomCode ? "ChoosePlayerInfo" : "EnterCode"];
}

function App() {
	const [mountId, setMountId] = useState(Date.now());

	const roomStage = useSelector((state: RootState) => state.room.stage);
	const gamePhase = useSelector((state: RootState) => state.game.phase);
	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.client.id);
	const isFirstPhase = useSelector(
		(state: RootState) => state.game.isFirstPhase
	);
	const roomId = useSelector((state: RootState) => state.room.id);
	const enteredRoomCode = useSelector(
		(state: RootState) => state.client.enteredRoomCode
	);

	const roomRole = players[playerId]?.roomRole;
	const gameRole = players[playerId]?.gameRole;

	const JoinView = joinView(enteredRoomCode);
	const RoomView = roomView({
		roomStage,
		roomRole,
		gamePhase,
		gameRole,
		isFirstPhase,
	});

	const View = roomId ? RoomView : JoinView;

	// This is a workaround to prevent AnimatePresence from getting out of sync by forcing
	// it to remount when the browser tab regains focus.
	// This is necessary because browsers throttle javascript execution on inactive tabs.
	useEffect(() => {
		function visibilityChangeHandler() {
			if (!document.hidden) {
				setMountId(Date.now());
			}
		}

		document.addEventListener("visibilitychange", visibilityChangeHandler);
		// cleanup the event lister on unmount to prevent memory leak
		return () => {
			document.removeEventListener("visibilitychange", visibilityChangeHandler);
		};
	}, []);

	// Hack to work around animation bug when leaving a room
	useEffect(() => {
		if (!roomId) {
			setMountId(Date.now());
		}
	}, [roomId]);

	return (
		<main className="flex min-h-[100dvh] flex-col items-center justify-between relative">
			<div className="h-[100dvh] w-screen flex flex-col items-center justify-center relative overflow-hidden">
				<MotionConfig reducedMotion="user" transition={containerSpring}>
					<AnimatePresenceWithDirection
						key={mountId}
						initial={false}
						mode="sync"
						direction={View.transition}
					>
						<TransitionContainer key={View.key}>
							<View.Component />
						</TransitionContainer>
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

export default App;
