import { useContext } from "react";
import { DirectionContext } from "@/components/animation/direction-context";
import { Direction } from "@/hooks/use-view-transition";
type TransitionProps = {
	x?: string;
	y?: string;
	opacity?: number;
};

// Helper function to get the directional offset for a transition
function getDirectionalOffset(direction: Direction): TransitionProps {
	const directionMap: Record<Direction, TransitionProps> = {
		[Direction.LEFT]: { x: "100%" }, // Enter from right side
		[Direction.RIGHT]: { x: "-100%" }, // Enter from left side
		[Direction.UP]: { y: "100%" }, // Enter from bottom
		[Direction.DOWN]: { y: "-100%" }, // Enter from top
		[Direction.UP_FADE]: { y: "100%", opacity: 0 },
		[Direction.DOWN_FADE]: { y: "100%", opacity: 0 },
		[Direction.NONE]: {},
	};

	return directionMap[direction];
}

// Helper function to invert an offset for exit animations
function getExitOffset(direction: Direction): TransitionProps {
	const directionMap: Record<Direction, TransitionProps> = {
		[Direction.LEFT]: { x: "-100%" }, // Exit to left side
		[Direction.RIGHT]: { x: "100%" }, // Exit to right side
		[Direction.UP]: { y: "-100%" }, // Exit to top
		[Direction.DOWN]: { y: "100%" }, // Exit to bottom
		[Direction.UP_FADE]: { y: "-100%", opacity: 0 },
		[Direction.DOWN_FADE]: { y: "-100%", opacity: 0 },
		[Direction.NONE]: {},
	};

	return directionMap[direction];
}

// Hook to generate variants for a transition
export function useTransitionVariants() {
	const direction = useContext(DirectionContext);

	const variants = {
		initial: {
			...getDirectionalOffset(direction),
			// transition: { duration: 0.3, ease: "easeInOut" },
		},
		target: {
			x: 0,
			y: 0,
			opacity: 1,
			// transition: { duration: 0.3, ease: "easeInOut" },
		},
		exit: {
			...getExitOffset(direction),
			// transition: { duration: 0.3, ease: "easeInOut" },
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
