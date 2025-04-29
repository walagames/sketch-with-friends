import { forwardRef } from "react";
import { motion, MotionProps } from "motion/react";
import { cn } from "@/lib/utils";
export const Doodle = forwardRef<
	HTMLImageElement,
	MotionProps &
		React.ImgHTMLAttributes<HTMLImageElement> & {
			duration?: number;
			delay?: number;
		}
>((props, ref) => {
	return (
		<motion.img
			className={cn("absolute hidden lg:block", props.className)}
			ref={ref}
			transition={{
				type: "spring",
				delay: props.delay,
				restDelta: 0.0001,
				restSpeed: 0.0001,
			}}
			{...props}
		/>
	);
});
