import {
	useTransform,
	animate,
	useMotionValue,
	motion,
	AnimationPlaybackControls,
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
			className="text-2xl font-bold bg-background min-w-10 min-h-10 flex items-center justify-center leading-none shadow-accent-sm rounded-lg"
		>
			<motion.span layout className="mt-1 px-2">
				{time}
			</motion.span>
		</motion.div>
	);
}
