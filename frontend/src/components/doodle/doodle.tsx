import { forwardRef } from "react";
import { motion, MotionProps } from "framer-motion";
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
			className={cn("absolute w-36 hidden lg:block", props.className)}
			ref={ref}
			transition={{
				type: "spring",
				restSpeed: 0.001,
				restDelta: 0.001,
				delay: props.delay,
			}}
			{...props}
		/>
	);
});
