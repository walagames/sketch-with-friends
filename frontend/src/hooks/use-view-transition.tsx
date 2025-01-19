import { useEffect } from "react";
import { useState } from "react";


import {
	EnterCodeView,
	EnterPlayerInfoView,
	WaitingView,
	DrawingView,
	PostDrawingView,
	PickingView,
} from "@/components/views";
import { RootState } from "@/state/store";
import { useSelector } from "react-redux";
import { RoomState } from "@/state/features/room";
import { AnimatePresenceWithDirection } from "@/components/animation/direction-context";
import { TransitionContainer } from "@/components/animation/transition-container";

export enum Direction {
	UP,
	UP_FADE,
	DOWN,
	DOWN_FADE,
	LEFT,
	RIGHT,
	NONE,
}

const views: Record<RoomState, View> = {
	[RoomState.EnterCode]: {
		Component: EnterCodeView,
		key: "enter-code-view",
		transition: {
			direction: Direction.RIGHT,
		},
		zIndex: 0,
	},
	[RoomState.EnterPlayerInfo]: {
		Component: EnterPlayerInfoView,
		key: "enter-player-info-view",
		transition: {
			direction: Direction.LEFT,
		},
		zIndex: 1,
	},
	[RoomState.Waiting]: {
		Component: WaitingView,
		key: "waiting-view",
		transition: {
			direction: Direction.LEFT,
		},
		zIndex: 2,
	},
	[RoomState.Picking]: {
		Component: PickingView,
		key: "picking-view",
		transition: {
			direction: Direction.LEFT,
		},
		zIndex: 3,
	},
	[RoomState.Drawing]: {
		Component: DrawingView,
		key: "drawing-view",
		transition: {
			direction: Direction.LEFT,
		},
		zIndex: 4,
	},
	[RoomState.PostDrawing]: {
		Component: PostDrawingView,
		key: "post-drawing-view",
		transition: {
			direction: Direction.LEFT,
		},
		zIndex: 5,
	},
	[RoomState.GameOver]: {
		Component: () => <></>,
		key: "game-over-view",
		transition: {
			direction: Direction.LEFT,
		},
		zIndex: 6,
	},
	[RoomState.Unanimous]: {
		Component: () => <></>,
		key: "unanimous-view",
		transition: {
			direction: Direction.LEFT,
		},
		zIndex: 7,
	},
};

export type View = {
	Component: React.ComponentType;
	key: string;
	transition: {
		direction: Direction;
	};
	zIndex: number;
};

// // Define possible positions for sprites in each view
// type SpritePosition = {
// 	left: string;
// 	top: string;
// 	rotate: number;
// 	opacity: number;
// };

const getView = (currentState: RoomState, previousState: RoomState) => {
	const view = { ...views[currentState] };

	if (previousState === RoomState.Waiting && currentState === RoomState.Picking) {
		// alert("UP");
		view.transition.direction = Direction.UP;
		view.key = "picking-view-first";
	}

	if (
		currentState === RoomState.Waiting &&
		previousState === RoomState.EnterPlayerInfo
	) {
		// alert("DOWN");
		view.transition.direction = Direction.DOWN;
		view.key = "waiting-view-first";
	}

	if (
		currentState === RoomState.Picking &&
		previousState === RoomState.PostDrawing
	) {
		// alert("LEFT");
		view.transition.direction = Direction.LEFT;
		view.key = "picking-view-second";
	}

	return view;
};

// // Map each game view to sprite positions
// const spritePositions: Record<GameView, SpritePosition> = {
//   [GameView.EnterCode]: {
//     left: "40%",
//     top: "45%",
//     rotate: 35,
//     opacity: 1
//   },
//   [GameView.EnterUsername]: {
//     left: "66%",
//     top: "45%",
//     rotate: 20,
//     opacity: 1
//   },
//   // ... positions for other views
// };

// Main view container that provides transition context
export function RoomViewContainer() {
	const currentState = useSelector(
		(state: RootState) => state.room.currentState
	);

	const previousState = useSelector(
		(state: RootState) => state.room.previousState
	);

	const View = getView(currentState, previousState);

	const [mountId, setMountId] = useState(Date.now());

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

	// const roomId = useSelector((state: RootState) => state.room.id);

	// // Hack to work around animation bug when leaving a room
	// useEffect(() => {
	// 	if (!roomId) {
	// 		setMountId(Date.now());
	// 	}
	// }, [roomId]);

	return (
		<AnimatePresenceWithDirection
			direction={View.transition.direction}
			mode="sync"
			key={mountId}
			initial={false}
		>
			<TransitionContainer zIndex={View.zIndex} key={View.key}>
				<View.Component />
				{/* <SceneSprites /> */}
			</TransitionContainer>
		</AnimatePresenceWithDirection>
	);
}
