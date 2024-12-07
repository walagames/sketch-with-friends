import {
	useTransform,
	animate,
	useMotionValue,
	AnimationPlaybackControls,
	motion,
} from "framer-motion";
import { useEffect } from "react";
export function Timer({ endTime }: { endTime: string }) {
	const count = useMotionValue(0);
	const time = useTransform(count, (v) => Math.ceil(v));

	useEffect(() => {
		let controls: AnimationPlaybackControls;

		function initializeTimer() {
			const duration = (new Date(endTime).getTime() - Date.now()) / 1000;
			count.set(duration);
			controls = animate(count, 0, {
				duration: duration,
				ease: "linear",
			});
		}

		initializeTimer();

		function visibilityChangeHandler() {
			if (document.hidden && controls) {
				controls.stop();
			} else {
				initializeTimer();
			}
		}

		document.addEventListener("visibilitychange", visibilityChangeHandler);
		return () => {
			if (controls) {
				controls.stop();
			}
			document.removeEventListener("visibilitychange", visibilityChangeHandler);
		};
	}, [count, endTime]);
	return (
		<motion.div
			layout
			layoutId="timer"
			transition={{ duration: 0.1 }}
			className="text-xl font-bold bg-background w-11 h-11 flex items-center justify-center leading-none shadow-accent-sm rounded-lg"
		>
			<motion.span className="mt-1 px-2">
				{time}
			</motion.span>
		</motion.div>
	);
}
