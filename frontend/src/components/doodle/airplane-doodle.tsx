import { forwardRef } from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { planeSpring } from "@/lib/motion";

export type DoodlePosition = {
	left?: string;
	top?: string;
	rotate?: number;
	opacity?: number;
};

const InstantConfig = {
	duration: 0,
	delay: 1.2,
};

export const AirplaneDoodle = forwardRef<
	HTMLImageElement,
	MotionProps &
		React.ImgHTMLAttributes<HTMLImageElement> & {
			duration?: number;
			startAt?: DoodlePosition;
			animateTo?: DoodlePosition;
			leaveTo?: DoodlePosition;
			skipTransition?: boolean;
			// layoutId?: string;
		}
>(({ skipTransition = false, ...props }, ref) => {
	return (
		<motion.img
			// layoutId={layoutId}
			className={cn("absolute w-28 hidden lg:block", props.className)}
			src="/doodles/paper-plane.png"
			ref={ref}
			animate={props.animateTo}
			exit={{ ...props.leaveTo, transition: planeSpring }}
			transition={skipTransition ? InstantConfig : planeSpring}
			initial={props.startAt}
			{...props}
		/>
	);
});
