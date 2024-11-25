import { RootState } from "@/state/store";
import {
	useTransform,
	animate,
	useMotionValue,
	motion,
	AnimationPlaybackControls,
	useMotionValueEvent,
} from "framer-motion";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import useSound from "use-sound";
export function Timer({
	endTime,
	playSound = false,
}: {
	endTime: string;
	playSound?: boolean;
}) {
	const count = useMotionValue(0);
	const time = useTransform(count, (v) => Math.ceil(v));
	const [isPlaying, setIsPlaying] = useState(false);
	const volume = useSelector((state: RootState) => state.preferences.volume);
	// const isAfterFive = useTransform(count, (v) => v <= 5);
	const [play] = useSound("/clock-ticking.mp3", {
		volume,
	});

	useMotionValueEvent(time, "change", (latest) => {
		if (latest === 5 && playSound && !isPlaying) {
			play();
			setIsPlaying(true);
		}
	});

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
			className="text-xl font-bold bg-background w-9 h-9 flex items-center justify-center leading-none shadow-accent-sm rounded-lg"
		>
			<motion.span layout className="mt-1 px-2">
				{time}
			</motion.span>
		</motion.div>
	);
}
