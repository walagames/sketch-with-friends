import { useEffect, useState } from "react";
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
import {
	AnimatePresence,
	HTMLMotionProps,
	MotionProps,
	MotionStyle,
	Target,
} from "framer-motion";
import { RainCloudDoodle } from "@/components/doodle/rain-cloud-doodle";
import { SkyScene } from "@/components/scenes/sky-scene";

export enum Direction {
	UP,
	UP_FADE,
	DOWN,
	DOWN_FADE,
	LEFT,
	RIGHT,
	NONE,
}

enum SpriteType {
	BOBBING,
	STATIC,
}

type Sprite = {
	style?: MotionStyle;
	type?: SpriteType;
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
				type: SpriteType.STATIC,
			},
			{
				Component: (props: HTMLMotionProps<"img">) => (
					<RainCloudDoodle
						duration={4}
						{...props}
						className="lg:top-[20%] top-[6%] lg:left-[12%] left-[6%]"
					/>
				),
				key: "rain-cloud-1",
				type: SpriteType.BOBBING,
			},
			{
				Component: (props: HTMLMotionProps<"img">) => (
					<RainCloudDoodle
						duration={5}
						className="top-[8%] left-[20%]"
						{...props}
					/>
				),
				key: "rain-cloud-2",
				type: SpriteType.BOBBING,
			},
			{
				Component: (props: HTMLMotionProps<"img">) => (
					<RainCloudDoodle
						duration={4.5}
						className="top-[10%] right-[10%]"
						{...props}
					/>
				),
				key: "rain-cloud-3",
				type: SpriteType.BOBBING,
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
				type: SpriteType.STATIC,
			},
			{
				Component: (props: HTMLMotionProps<"img">) => (
					<RainCloudDoodle
						duration={6}
						className="top-[5%] left-[12%]"
						{...props}
					/>
				),
				key: "rain-cloud-1",
				type: SpriteType.BOBBING,
			},
			{
				Component: (props: HTMLMotionProps<"img">) => (
					<RainCloudDoodle
						duration={4}
						className="top-[24%] right-[10%]"
						{...props}
					/>
				),
				key: "rain-cloud-2",
				type: SpriteType.BOBBING,
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
				type: SpriteType.STATIC,
			},
			{
				Component: (props: HTMLMotionProps<"img">) => (
					<RainCloudDoodle
						duration={5}
						className="top-[8%] left-[12%]"
						{...props}
					/>
				),
				key: "rain-cloud-1",
				type: SpriteType.BOBBING,
			},
			{
				Component: (props: HTMLMotionProps<"img">) => (
					<RainCloudDoodle
						duration={4}
						className="top-[24%] right-[10%]"
						{...props}
					/>
				),
				key: "rain-cloud-2",
				type: SpriteType.BOBBING,
			},
			{
				Component: (props: HTMLMotionProps<"img">) => (
					<RainCloudDoodle
						duration={4}
						className="bottom-[24%] right-[16%] w-28 lg:hidden"
						{...props}
					/>
				),
				key: "rain-cloud-3",
				type: SpriteType.BOBBING,
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
				type: SpriteType.STATIC,
			},
			{
				Component: (props: HTMLMotionProps<"img">) => (
					<RainCloudDoodle
						duration={4}
						className="top-[20%] left-[12%]"
						{...props}
					/>
				),
				key: "rain-cloud-1",
				type: SpriteType.BOBBING,
			},
			{
				Component: (props: HTMLMotionProps<"img">) => (
					<RainCloudDoodle
						duration={5}
						className="top-[8%] left-[20%]"
						{...props}
					/>
				),
				key: "rain-cloud-2",
				type: SpriteType.BOBBING,
			},
			{
				Component: (props: HTMLMotionProps<"img">) => (
					<RainCloudDoodle
						duration={4.5}
						className="top-[10%] right-[10%]"
						{...props}
					/>
				),
				key: "rain-cloud-3",
				type: SpriteType.BOBBING,
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
				type: SpriteType.STATIC,
			},
			{
				Component: (props: HTMLMotionProps<"img">) => (
					<RainCloudDoodle
						duration={5}
						className="top-[20%] right-[4%]"
						{...props}
					/>
				),
				key: "rain-cloud-1",
				type: SpriteType.BOBBING,
			},
			{
				Component: (props: HTMLMotionProps<"img">) => (
					<RainCloudDoodle
						duration={4}
						className="top-[8%] left-[5%]"
						{...props}
					/>
				),
				key: "rain-cloud-2",
				type: SpriteType.BOBBING,
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
					left: 0.15,
					top: 0.55,
					rotate: 25,
					opacity: 1,
					zIndex: 50,
				},
				Component: AirplaneDoodle,
				key: "airplane-doodle",
				type: SpriteType.STATIC,
			},
			{
				Component: (props: HTMLMotionProps<"img">) => (
					<RainCloudDoodle
						duration={5}
						className="absolute hidden md:block h-32 top-[8%] left-[20%]"
						{...props}
					/>
				),
				key: "rain-cloud-1",
				type: SpriteType.BOBBING,
			},
			{
				Component: (props: HTMLMotionProps<"img">) => (
					<RainCloudDoodle
						duration={4.5}
						className="absolute hidden md:block h-32 top-[10%] right-[10%]"
						{...props}
					/>
				),
				key: "rain-cloud-2",
				type: SpriteType.BOBBING,
			},
		],
		zIndex: 5,
	},
	[RoomState.GameOver]: {
		Component: () => (
			<SkyScene>
				<div className="text-white text-2xl font-bold">Game over</div>
			</SkyScene>
		),
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
				},
				Component: AirplaneDoodle,
				key: "airplane-doodle",
				type: SpriteType.STATIC,
			},
		],
		zIndex: 6,
	},
	[RoomState.Unanimous]: {
		Component: () => <></>,
		key: "unanimous-view",
		transition: {
			direction: Direction.NONE,
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
				type: SpriteType.STATIC,
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
		view.key = "picking-view";
		view.zIndex = 10;
	}

	if (currentState === RoomState.Waiting) {
		view.transition.direction = Direction.DOWN;
		view.key = "waiting-view-first";
		if (previousState === RoomState.PostDrawing) {
			view.zIndex = 10;
		}
	}

	if (currentState === RoomState.Drawing) {
		view.transition.direction = Direction.LEFT;
		view.key = "drawing-view";
		view.zIndex = 20;
	}

	if (
		currentState === RoomState.PostDrawing &&
		previousState === RoomState.Drawing
	) {
		view.transition.direction = Direction.LEFT;
		view.key = "post-drawing-view";
		view.zIndex = 10;
	}

	if (
		currentState === RoomState.Picking &&
		previousState === RoomState.PostDrawing
	) {
		view.transition.direction = Direction.LEFT;
		view.key = "picking-view-second";
		view.zIndex = 10;
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
				{/* <SceneSprites /> */}
			</TransitionContainer>
		</AnimatePresenceWithDirection>
	);
}

export function SceneSprites() {
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

		if (previousView.transition.direction === Direction.NONE) {
			offsets.left = 0;
			offsets.top = 0;
		}

		return offsets;
	}

	const offsets = getSpritePositionOffset();

	const spritePosition = () => {
		if (!currentView.sprites?.[0]?.style) return {};
		return {
			...currentView.sprites?.[0]?.style,
			top: `${(currentView.sprites?.[0]?.style?.top as number) * 100}%`,
			left: `${(currentView.sprites?.[0]?.style?.left as number) * 100}%`,
		};
	};

	const previousSpritePosition = () => {
		if (!previousSprite) return spritePosition;
		return {
			...previousSprite?.style,
			top: `${((previousSprite?.style?.top as number) + offsets.top) * 100}%`,
			left: `${
				((previousSprite?.style?.left as number) + offsets.left) * 100
			}%`,
		};
	};

	const exit = () => {
		if (!previousSprite) return {};
		return {
			opacity: 0,
			transition: { duration: 0 },
		};
	};

	const staticSprites = currentView.sprites?.filter(
		(sprite) => sprite.type === SpriteType.STATIC
	);

	const bobbingSprites = currentView.sprites?.filter(
		(sprite) => sprite.type === SpriteType.BOBBING
	);

	return (
		<>
			{staticSprites?.map((sprite) => (
				<sprite.Component
					key={sprite.key}
					initial={previousSpritePosition() as Target}
					animate={spritePosition as Target}
					exit={exit()}
				/>
			))}
			<AnimatePresence>
				{bobbingSprites?.map((sprite) => (
					<sprite.Component key={sprite.key} />
				))}
			</AnimatePresence>
		</>
	);
}
