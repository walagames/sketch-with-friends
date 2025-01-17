import { useContext } from "react";

import { useEffect } from "react";
import { useState } from "react";

import { createContext } from "react";

import {
	EnterCodeView,
	EnterPlayerInfoView,
	WaitingView,
	DrawingView,
	PostDrawingView,
	PickingView,
} from "@/components/views";
import { GameRole } from "@/state/features/game";
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
	},
	[RoomState.EnterPlayerInfo]: {
		Component: EnterPlayerInfoView,
		key: "enter-player-info-view",
		transition: {
			direction: Direction.LEFT,
		},
	},
	[RoomState.Waiting]: {
		Component: WaitingView,
		key: "waiting-view",
		transition: {
			direction: Direction.DOWN,
		},
	},
	[RoomState.Picking]: {
		Component: PickingView,
		key: "picking-view",
		transition: {
			direction: Direction.LEFT,
		},
	},
	[RoomState.Drawing]: {
		Component: DrawingView,
		key: "drawing-view",
		transition: {
			direction: Direction.LEFT,
		},
	},
	[RoomState.PostDrawing]: {
		Component: PostDrawingView,
		key: "post-drawing-view",
		transition: {
			direction: Direction.LEFT,
		},
	},
	[RoomState.GameOver]: {
		Component: () => <></>,
		key: "game-over-view",
		transition: {
			direction: Direction.LEFT,
		},
	},
	[RoomState.Unanimous]: {
		Component: () => <></>,
		key: "unanimous-view",
		transition: {
			direction: Direction.LEFT,
		},
	},
};

// Now determining transitions becomes much simpler
function getTransitionDirection(from: RoomState, to: RoomState): Direction {
	// Moving to a higher number means progressing forward
	if (to > from) {
		// Special case: Moving from post-drawing back to picking
		if (from === RoomState.PostDrawing && to === RoomState.Picking) {
			return Direction.UP; // Circle back to start of game round
		}
		return Direction.LEFT; // Normal game progression
	}

	// Moving to a lower number means going backwards
	if (to < from) {
		// Special case: Leaving a room (going back to join flow)
		// alert("from: " + from + " to: " + to);
		if (from >= RoomState.Waiting && to <= RoomState.EnterPlayerInfo) {
			return Direction.RIGHT;
		}
		return Direction.RIGHT; // Normal backward movement
	}

	return Direction.LEFT; // Same view
}

export type View = {
	Component: React.ComponentType;
	key: string;
	transition: {
		direction: Direction;
	};
};

// Define possible positions for sprites in each view
type SpritePosition = {
	left: string;
	top: string;
	rotate: number;
	opacity: number;
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

// Create a context to share view transition information
type ViewTransitionContext = {
	from: RoomState | null;
	to: RoomState | null;
	direction: Direction;
};

const ViewTransitionContext = createContext<ViewTransitionContext>({
	from: RoomState.EnterCode,
	to: RoomState.EnterPlayerInfo,
	direction: Direction.RIGHT,
});

// A hook to manage view transitions and sprite animations
function useViewTransition(currentState: RoomState) {
	const [transitionState, setTransitionState] = useState<ViewTransitionContext>(
		{
			from: RoomState.Unanimous,
			to: currentState,
			direction: Direction.RIGHT,
		}
	);

	// Update transition state when view changes
	useEffect(() => {
		setTransitionState((prev) => ({
			from: prev.to,
			to: currentState,
			direction: getTransitionDirection(prev.to!, currentState),
		}));
	}, [currentState]);

	return transitionState;
}

// Main view container that provides transition context
export function RoomViewContainer() {
	const currentState = useSelector(
		(state: RootState) => state.room.currentState
	);
	const transitionState = useViewTransition(currentState);

	const View = views[currentState];

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

	const roomId = useSelector((state: RootState) => state.room.id);

	// Hack to work around animation bug when leaving a room
	useEffect(() => {
		if (!roomId) {
			setMountId(Date.now());
		}
	}, [roomId]);

	return (
		<ViewTransitionContext.Provider value={transitionState}>
			<AnimatePresenceWithDirection
				direction={transitionState.direction}
				mode="sync"
				key={mountId}
				initial={false}
			>
				<TransitionContainer key={View.key}>
					<View.Component />
					{/* <SceneSprites /> */}
				</TransitionContainer>
			</AnimatePresenceWithDirection>
		</ViewTransitionContext.Provider>
	);
}

// // A component to manage sprites that are aware of view transitions
// function SceneSprites() {
// 	const { from, to } = useContext(ViewTransitionContext);

// 	// Get sprite positions for current transition
// 	const fromPosition = from ? spritePositions[from] : null;
// 	const toPosition = to ? spritePositions[to] : null;

// 	return (
// 		<AnimatePresence mode="sync">
// 			<AirplaneDoodle
// 				layoutId="airplane"
// 				// If we're transitioning between known states, use those positions
// 				startAt={fromPosition ?? toPosition}
// 				animateTo={toPosition}
// 				// Calculate exit position based on next view's entry point
// 				leaveTo={toPosition}
// 				// Add a custom variant for handling late-join scenarios
// 				variants={{
// 					lateJoin: {
// 						// Special animation for when a player late-joins
// 						opacity: 0,
// 						transition: { duration: 0 },
// 					},
// 				}}
// 				// Use a custom prop to detect late-join scenarios
// 				animate={isLateJoin ? "lateJoin" : "animate"}
// 			/>
// 		</AnimatePresence>
// 	);
// }
