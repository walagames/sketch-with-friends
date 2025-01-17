import { useContext } from "react";
import {
	Direction,
	DirectionContext,
} from "@/components/animation/direction-context";

type TransitionProps = {
	x?: string;
	y?: string;
	opacity?: number;
};

// Helper function to get the directional offset for a transition
function getDirectionalOffset(direction: Direction): TransitionProps {
	const directionMap: Record<Direction, TransitionProps> = {
		[Direction.LEFT]: { x: "100%" },
		[Direction.RIGHT]: { x: "-100%" },
		[Direction.UP]: { y: "100%" },
		[Direction.DOWN]: { y: "-100%" },
		[Direction.UP_FADE]: { y: "100%", opacity: 0 },
		[Direction.DOWN_FADE]: { y: "100%", opacity: 0 },
	};

	return directionMap[direction];
}

// Helper function to invert an offset for exit animations
function invertOffset(offset: TransitionProps): TransitionProps {
	return {
		x: offset.x ? (offset.x.startsWith("-") ? "100%" : "-100%") : undefined,
		y: offset.y ? (offset.y.startsWith("-") ? "100%" : "-100%") : undefined,
		opacity: offset.opacity,
	};
}

// Hook to generate variants for a transition
export function useTransitionVariants() {
	const direction = useContext(DirectionContext);

	const variants = {
		initial: {
			...getDirectionalOffset(direction),
			// transition: { duration: 0 },
		},
		target: {
			x: 0,
			y: 0,
			opacity: 1,
			// transition: { duration: 0.3 },
		},
		exit: {
			...invertOffset(getDirectionalOffset(direction)),
			// transition: { duration: 0.3 },
		},
	};

	return {
		variants,
		custom: direction,
		initial: "initial",
		animate: "target",
		exit: "exit",
	};
}
