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
					y: direction === Direction.DOWN ? "100%" : "-100%",
			  };
	},
	target: {
		x: "0%",
		y: "0%",
	},
	exit: (direction: Direction) => {
		const isHorizontal =
			direction === Direction.RIGHT || direction === Direction.LEFT;
		return isHorizontal
			? {
					x: direction === Direction.RIGHT ? "100%" : "-100%",
			  }
			: {
					y: direction === Direction.DOWN ? "-100%" : "100%",
			  };
	},
};

export const useDirectionAnimation = () => {
	const direction = useContext(DirectionContext);

	console.log("direction in useDirectionAnimation", direction);

	return {
		variants,
		custom: direction,
		initial: "initial",
		animate: "target",
		exit: "exit",
	};
};
