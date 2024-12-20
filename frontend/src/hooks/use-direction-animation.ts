import { useContext } from "react";
import {
	Direction,
	DirectionContext,
} from "@/components/animation/direction-context";

const variants = {
	initial: (direction: Direction) => {
		const isHorizontal =
			direction === Direction.RIGHT || direction === Direction.LEFT;
		return isHorizontal
			? {
					x: direction === Direction.RIGHT ? "-100%" : "100%",
			  }
			: {
					y:
						direction === Direction.DOWN || direction === Direction.DOWN_FADE
							? "100%"
							: "-100%",
			  };
	},
	target: (direction: Direction) => {
		const isHorizontal =
			direction === Direction.RIGHT || direction === Direction.LEFT;

		return isHorizontal
			? {
					x: "0%",
			  }
			: {
					y: "0%",
			  };
	},
	exit: (direction: Direction) => {
		const isHorizontal =
			direction === Direction.RIGHT || direction === Direction.LEFT;
		const isFade =
			direction === Direction.DOWN_FADE || direction === Direction.UP_FADE;
		return isHorizontal
			? {
					x: direction === Direction.RIGHT ? "100%" : "-100%",
					opacity: isFade ? 0 : 1,
			  }
			: {
					y:
						direction === Direction.DOWN || direction === Direction.DOWN_FADE
							? "-100%"
							: "100%",
					opacity: isFade ? 0 : 1,
			  };
	},
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
