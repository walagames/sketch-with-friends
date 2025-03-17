import { ForwardedRef, forwardRef } from "react";
import { HTMLMotionProps, motion } from "motion/react";
import { cn } from "@/lib/utils";

export const RainCloudDoodle = forwardRef<
	HTMLImageElement,
	HTMLMotionProps<"img"> & { duration: number }
>(function RainCloudDoodle(
	{ className, ...props }: HTMLMotionProps<"img"> & { duration: number },
	ref: ForwardedRef<HTMLImageElement>
) {
	return (
		<motion.img
			src="/doodles/rain-cloud.png"
			className={cn(className, "absolute w-36")}
			ref={ref}
			animate={{ y: [0, 20, 0], opacity: 1 }}
			transition={{
				repeat: Infinity,
				repeatType: "loop",
				duration: props.duration,
				ease: "easeInOut",
			}}
		/>
	);
});
