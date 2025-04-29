import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "motion/react";
import { ForwardedRef, forwardRef } from "react";

const transition = {
	type: "spring",
	stiffness: 250,
	damping: 40,
	restSpeed: 0.001,
	restDelta: 0.001,
};

export const AirplaneDoodle = forwardRef<
	HTMLImageElement,
	HTMLMotionProps<"img">
>(function AirplaneDoodle(
	props: HTMLMotionProps<"img">,
	ref: ForwardedRef<HTMLImageElement>
) {
	return (
		<motion.img
			ref={ref}
			className={cn("absolute w-28 hidden lg:block", props.className)}
			src="/doodles/paper-plane.png"
			transition={transition}
			{...props}
		/>
	);
});
