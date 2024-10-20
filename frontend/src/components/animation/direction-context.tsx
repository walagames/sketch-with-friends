import { createContext } from "react";
import { AnimatePresence, AnimatePresenceProps } from "framer-motion";

export enum Direction {
	UP,
	DOWN,
	LEFT,
	RIGHT,
}

export const DirectionContext = createContext<Direction>(Direction.RIGHT);

type AnimatePresenceWithDirectionProps = {
	children: React.ReactNode;
	direction: Direction;
} & Omit<AnimatePresenceProps, "custom">;

export const AnimatePresenceWithDirection = ({
	children,
	direction,
	...props
}: AnimatePresenceWithDirectionProps) => {
	console.log("AnimatePresenceWithDirection", direction);
	return (
		<DirectionContext.Provider value={direction}>
			<AnimatePresence {...props} custom={direction}>
				{children}
			</AnimatePresence>
		</DirectionContext.Provider>
	);
};
