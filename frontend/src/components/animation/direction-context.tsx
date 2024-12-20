import { createContext } from "react";
import { AnimatePresence, AnimatePresenceProps } from "framer-motion";

export enum Direction {
	UP,
	UP_FADE,
	DOWN,
	DOWN_FADE,
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
	return (
		<DirectionContext.Provider value={direction}>
			<AnimatePresence {...props} custom={direction}>
				{children}
			</AnimatePresence>
		</DirectionContext.Provider>
	);
};
