import { forwardRef } from "react";
import { motion, MotionProps, useReducedMotion } from "framer-motion";
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

const NoMotionConfig = {
	duration: 0,
	delay: 0,
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
			delay?: number;
		}
>(({ skipTransition = false, ...props }, ref) => {
	const reducedMotion = useReducedMotion();

	const transition = !reducedMotion
		? skipTransition
			? InstantConfig
			: { ...planeSpring, delay: props.delay }
		: NoMotionConfig;

	return (
		<motion.img
			className={cn("absolute w-28 hidden lg:block", props.className)}
			src="/doodles/paper-plane.png"
			ref={ref}
			animate={props.animateTo}
			exit={{
				...props.leaveTo,
				// transition: reducedMotion ? NoMotionConfig : planeSpring,
			}}
			transition={transition}
			initial={props.startAt}
			{...props}
		/>
	);
});
