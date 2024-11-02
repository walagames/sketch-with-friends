import { forwardRef } from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export const BobbingDoodle = forwardRef<
	HTMLImageElement,
	MotionProps &
		React.ImgHTMLAttributes<HTMLImageElement> & { duration?: number }
>((props, ref) => {
	return (
		<motion.img
			className={cn("absolute w-36 hidden lg:block", props.className)}
			ref={ref}
			animate={{ y: [0, 15, 0] }}
			transition={{
				repeat: Infinity,
				repeatType: "loop",
				duration: props.duration ?? 5,
				ease: "easeInOut",
			}}
			{...props}
		/>
	);
});
