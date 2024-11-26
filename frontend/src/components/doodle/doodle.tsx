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
			className={cn("absolute hidden lg:block", props.className)}
			ref={ref}
			transition={{
				type: "spring",
				delay: props.delay,
			}}
			{...props}
		/>
	);
});
