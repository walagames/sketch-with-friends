import {
	AnimatePresence,
	HTMLMotionProps,
	motion,
	MotionStyle,
	Target,
	usePresenceData,
} from "motion/react";
import { forwardRef, useEffect, useMemo, useState } from "react";
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
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
import { RainCloudDoodle } from "@/components/doodle/rain-cloud-doodle";
import { SkyScene } from "@/components/scenes/sky-scene";

export enum Direction {
	UP,
	DOWN,
	LEFT,
	RIGHT,
}

enum SpriteType {
	BOBBING,
	STATIC,
}

type Sprite = {
	style?: MotionStyle;
	type?: SpriteType;
	Component: React.ComponentType<HTMLMotionProps<"img">>;
	key: string;
};

export type View = {
	Component: React.ComponentType;
	key: string;
	sprites?: Sprite[];
};

const views: Record<RoomState, View> = {
	[RoomState.EnterCode]: {
		Component: EnterCodeView,
		key: "enter-code-view",
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
						className="lg:top-[20%] top-[2%] lg:left-[12%] left-[6%]"
					/>
				),
				key: "rain-cloud-1",
				type: SpriteType.BOBBING,
			},
			{
				Component: (props: HTMLMotionProps<"img">) => (
					<RainCloudDoodle
						duration={5}
						className="top-[8%] left-[20%] hidden lg:block"
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
						className="top-[10%] right-[10%] hidden lg:block"
						{...props}
					/>
				),
				key: "rain-cloud-3",
				type: SpriteType.BOBBING,
			},
		],
	},
	[RoomState.EnterPlayerInfo]: {
		Component: EnterPlayerInfoView,
		key: "enter-player-info-view",
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
						className="top-[5%] lg:left-[12%] right-[12%]"
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
						className="top-[24%] right-[10%] hidden lg:block"
						{...props}
					/>
				),
				key: "rain-cloud-2",
				type: SpriteType.BOBBING,
			},
		],
	},
	[RoomState.Waiting]: {
		Component: WaitingView,
		key: "waiting-view",
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
	},
	[RoomState.Picking]: {
		Component: PickingView,
		key: "picking-view",
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
						className="top-[20%] left-[12%] hidden lg:block"
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
						className="top-[10%] right-[10%] hidden lg:block"
						{...props}
					/>
				),
				key: "rain-cloud-3",
				type: SpriteType.BOBBING,
			},
		],
	},
	[RoomState.Drawing]: {
		Component: DrawingView,
		key: "drawing-view",
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
	},
	[RoomState.PostDrawing]: {
		Component: PostDrawingView,
		key: "post-drawing-view",
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
	},
	[RoomState.GameOver]: {
		Component: () => (
			<SkyScene>
				<div className="text-white text-2xl font-bold">Game over</div>
			</SkyScene>
		),
		key: "game-over-view",
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
	},
	[RoomState.Unanimous]: {
		Component: () => <></>,
		key: "unanimous-view",
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
	},
};

type TransitionProps = {
	x?: string;
	y?: string;
};

const resolveTransitionDirection = (
	previousState: RoomState,
	currentState: RoomState
) => {
	// Slide down the waiting view
	if (currentState === RoomState.Waiting) {
		return Direction.DOWN;
	}

	// Slide up from the waiting view
	if (previousState === RoomState.Waiting) {
		return Direction.UP;
	}

	// We are transitioning from a higher state to a lower state
	// We might want to cycle again in the same direction or go back to a previous screen
	if (previousState > currentState) {
		// We are starting the next round, so we want to cycle again in the same direction
		if (previousState === RoomState.PostDrawing) {
			return Direction.LEFT;
		}

		// We are going back to a previous screen ie. EnterPlayerInfoView -> EnterCodeView
		return Direction.RIGHT;
	}

	// Normal transition
	return Direction.LEFT;
};

// Main view container that provides transition context
export function RoomViewManager() {
	const currentState = useSelector(
		(state: RootState) => state.room.currentState
	);

	const previousState = useSelector(
		(state: RootState) => state.room.previousState
	);

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

	const direction = resolveTransitionDirection(previousState, currentState);

	return (
		<div
			key={mountId}
			className="h-[100dvh] w-screen flex flex-col items-center justify-center relative overflow-hidden"
		>
			<AnimatePresence initial={false} mode="sync" custom={direction}>
				<ViewTransitionContainer key={View.key}>
					<View.Component />
					<SceneSprites
						currentState={currentState}
						previousState={previousState}
					/>
				</ViewTransitionContainer>
			</AnimatePresence>
		</div>
	);
}

export const ViewTransitionContainer = forwardRef(
	(
		{ children }: { children: React.ReactNode },
		ref: React.Ref<HTMLDivElement>
	) => {
		const direction: Direction = usePresenceData();

		const transitionCount = useSelector(
			(state: RootState) => state.room.transitionCount
		);

		const zIndex = useMemo(() => {
			return transitionCount * 10;
		}, [transitionCount]);

		const exitDirectionMap: Record<Direction, TransitionProps> = {
			[Direction.LEFT]: { x: "-100%" }, // Exit to left side
			[Direction.RIGHT]: { x: "100%" }, // Exit to right side
			[Direction.UP]: { y: "-100%" }, // Exit to top
			[Direction.DOWN]: { y: "100%" }, // Exit to bottom
		};

		const enterDirectionMap: Record<Direction, TransitionProps> = {
			[Direction.LEFT]: { x: "100%" }, // Enter from right side
			[Direction.RIGHT]: { x: "-100%" }, // Enter from left side
			[Direction.UP]: { y: "100%" }, // Enter from bottom
			[Direction.DOWN]: { y: "-100%" }, // Enter from top
		};

		const initial = enterDirectionMap[direction];
		const target = {
			x: 0,
			y: 0,
		};
		const exit = exitDirectionMap[direction];

		return (
			<motion.div
				ref={ref}
				style={{ zIndex }}
				className="absolute inset-0 bg-background-secondary"
				initial={initial}
				animate={target}
				exit={exit}
			>
				{children}
			</motion.div>
		);
	}
);

function getSpritePositionOffset(direction: Direction) {
	const offsets = {
		top: 0,
		left: 0,
	};

	switch (direction) {
		case Direction.LEFT:
			offsets.left = -1;
			break;
		case Direction.RIGHT:
			offsets.left = 1;
			break;
		case Direction.UP:
			offsets.left = -1;
			break;
		case Direction.DOWN:
			offsets.top = 1;
			break;
	}

	return offsets;
}

export function SceneSprites({
	currentState,
	previousState,
}: {
	currentState: RoomState;
	previousState: RoomState;
}) {
	const currentView = views[currentState];
	const previousView = views[previousState];

	const custom: Direction = usePresenceData();

	const previousSprite = previousView.sprites?.find(
		(s) => s.key === currentView.sprites?.[0]?.key
	);

	const offsets = getSpritePositionOffset(custom);

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
					animate={spritePosition() as Target}
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
