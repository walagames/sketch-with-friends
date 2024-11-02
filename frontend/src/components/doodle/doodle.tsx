import { forwardRef } from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export const Doodle = forwardRef<
	HTMLImageElement,
	MotionProps &
		React.ImgHTMLAttributes<HTMLImageElement> & { duration?: number }
>((props, ref) => {
	return (
		<motion.img
			className={cn("absolute w-36", props.className)}
			ref={ref}
			{...props}
		/>
	);
});
