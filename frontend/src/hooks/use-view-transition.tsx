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
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
import { MotionProps, MotionStyle, Target } from "framer-motion";

export enum Direction {
	UP,
	UP_FADE,
	DOWN,
	DOWN_FADE,
	LEFT,
	RIGHT,
	NONE,
}

type Sprite = {
	style: MotionStyle;
	Component: React.ComponentType<MotionProps>;
	key: string;
};

export type View = {
	Component: React.ComponentType;
	key: string;
	transition: {
		direction: Direction;
	};
	sprites?: Sprite[];
	zIndex: number;
};

const views: Record<RoomState, View> = {
	[RoomState.EnterCode]: {
		Component: EnterCodeView,
		key: "enter-code-view",
		transition: {
			direction: Direction.RIGHT,
		},
		sprites: [
			{
				style: {
					left: 0.66,
					top: 0.45,
					rotate: 20,
					opacity: 1,
				},
				Component: AirplaneDoodle,
				key: "airplane-doodle",
			},
		],
		zIndex: 0,
	},
	[RoomState.EnterPlayerInfo]: {
		Component: EnterPlayerInfoView,
		key: "enter-player-info-view",
		transition: {
			direction: Direction.LEFT,
		},
		sprites: [
			{
				style: {
					left: 0.25,
					top: 0.6,
					rotate: 25,
					opacity: 1,
				},
				Component: AirplaneDoodle,
				key: "airplane-doodle",
			},
		],
		zIndex: 1,
	},
	[RoomState.Waiting]: {
		Component: WaitingView,
		key: "waiting-view",
		transition: {
			direction: Direction.LEFT,
		},
		sprites: [
			{
				style: {
					left: 0.8,
					top: 0.8,
					rotate: 5,
					opacity: 1,
				},
				Component: AirplaneDoodle,
				key: "airplane-doodle",
			},
		],
		zIndex: 2,
	},
	[RoomState.Picking]: {
		Component: PickingView,
		key: "picking-view",
		transition: {
			direction: Direction.LEFT,
		},
		sprites: [
			{
				style: {
					left: 0.45,
					top: 0.65,
					rotate: 30,
					opacity: 1,
				},
				Component: AirplaneDoodle,
				key: "airplane-doodle",
			},
		],
		zIndex: 3,
	},
	[RoomState.Drawing]: {
		Component: DrawingView,
		key: "drawing-view",
		transition: {
			direction: Direction.LEFT,
		},
		sprites: [
			{
				style: {
					left: 0.85,
					top: 0.55,
					rotate: 30,
					opacity: 1,
				},
				Component: AirplaneDoodle,
				key: "airplane-doodle",
			},
		],
		zIndex: 4,
	},
	[RoomState.PostDrawing]: {
		Component: PostDrawingView,
		key: "post-drawing-view",
		transition: {
			direction: Direction.LEFT,
		},
		sprites: [
			{
				style: {
					left: 0.05,
					top: 0.55,
					rotate: 20,
					opacity: 1,
				},
				Component: AirplaneDoodle,
				key: "airplane-doodle",
			},
		],
		zIndex: 5,
	},
	[RoomState.GameOver]: {
		Component: () => <></>,
		key: "game-over-view",
		transition: {
			direction: Direction.LEFT,
		},
		sprites: [
			{
				style: {
					left: 0.9,
					top: 0.45,
					rotate: 0,
					opacity: 0.5,
				},
				Component: AirplaneDoodle,
				key: "airplane-doodle",
			},
		],
		zIndex: 6,
	},
	[RoomState.Unanimous]: {
		Component: () => <></>,
		key: "unanimous-view",
		transition: {
			direction: Direction.LEFT,
		},
		sprites: [
			{
				style: {
					left: 0.95,
					top: 0.45,
					rotate: -15,
					opacity: 0.3,
				},
				Component: AirplaneDoodle,
				key: "airplane-doodle",
			},
		],
		zIndex: 7,
	},
};

const getView = (currentState: RoomState, previousState: RoomState) => {
	const view = { ...views[currentState] };

	if (
		previousState === RoomState.Waiting &&
		currentState === RoomState.Picking
	) {
		view.transition.direction = Direction.UP;
		view.key = "picking-view-first";
	}

	if (
		currentState === RoomState.Waiting &&
		previousState === RoomState.EnterPlayerInfo
	) {
		view.transition.direction = Direction.DOWN;
		view.key = "waiting-view-first";
	}

	if (
		currentState === RoomState.Picking &&
		previousState === RoomState.PostDrawing
	) {
		view.transition.direction = Direction.LEFT;
		view.key = "picking-view-second";
	}

	return view;
};

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

	return (
		<AnimatePresenceWithDirection
			direction={View.transition.direction}
			mode="sync"
			key={mountId}
			initial={false}
		>
			<TransitionContainer zIndex={View.zIndex} key={View.key}>
				<View.Component />
				<SceneSprites />
			</TransitionContainer>
		</AnimatePresenceWithDirection>
	);
}

function SceneSprites() {
	const currentState = useSelector(
		(state: RootState) => state.room.currentState
	);

	const previousState = useSelector(
		(state: RootState) => state.room.previousState
	);

	const currentView = getView(currentState, previousState);
	const previousView = views[previousState];

	const previousSprite = previousView.sprites?.find(
		(s) => s.key === currentView.sprites?.[0]?.key
	);

	function getSpritePositionOffset() {
		const offsets = {
			top: 0,
			left: 0,
		};

		if (currentView.transition.direction === Direction.LEFT) {
			offsets.left = -1;
		}

		if (currentView.transition.direction === Direction.RIGHT) {
			offsets.left = 1;
		}

		if (currentView.transition.direction === Direction.UP) {
			offsets.top = 0;
			offsets.left = -1;
		}

		if (currentView.transition.direction === Direction.DOWN) {
			offsets.top = 1;
		}

		return offsets;
	}

	const offsets = getSpritePositionOffset();

	const spritePosition = {
		...currentView.sprites?.[0]?.style,
		top: `${(currentView.sprites?.[0]?.style.top as number) * 100}%`,
		left: `${(currentView.sprites?.[0]?.style.left as number) * 100}%`,
	};

	const previousSpritePosition = () => {
		if (!previousSprite) return spritePosition;
		return {
			...previousSprite?.style,
			top: `${((previousSprite?.style.top as number) + offsets.top) * 100}%`,
			left: `${((previousSprite?.style.left as number) + offsets.left) * 100}%`,
		};
	};

	const exit = () => {
		if (!previousSprite) return {};
		return {
			opacity: 0,
			transition: { duration: 0 },
		};
	};

	return (
		<>
			{currentView.sprites?.map((sprite) => (
				<sprite.Component
					key={sprite.key}
					initial={previousSpritePosition() as Target}
					animate={spritePosition as Target}
					exit={exit()}
				/>
			))}
		</>
	);
}
