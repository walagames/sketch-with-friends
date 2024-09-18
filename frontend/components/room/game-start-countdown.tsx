"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRoomContext } from "../../contexts/room-context";

const textVariants = {
	hidden: { pathLength: 0, y: 2, x: 3, fillOpacity: 0, opacity: 0 },
	visible: (i: number) => {
		const delay = (i - 0.4) * 0.5;
		return {
			opacity: 1,
			pathLength: 1,
			y: 0,
			x: 0,
			fillOpacity: 1,
			transition: {
				opacity: {
					type: "spring",
					stiffness: 500,
					damping: 50,
					mass: 1,
					delay: delay,
				},
				pathLength: {
					type: "spring",
					stiffness: 500,
					damping: 50,
					mass: 1,
					delay: delay,
				},
				fillOpacity: {
					type: "spring",
					stiffness: 500,
					damping: 50,
					mass: 1,
					delay: delay + 0.5,
				},
				x: {
					type: "spring",
					stiffness: 500,
					damping: 50,
					mass: 1,
					delay: delay + 0.2,
				},
				y: {
					type: "spring",
					stiffness: 500,
					damping: 50,
					mass: 1,
					delay: delay + 0.2,
				},
			},
		};
	},
};

function AnimatedSketchText(props: React.ComponentProps<typeof motion.svg>) {
	const strokeWidth = "0.16px";
	return (
		<motion.svg
			{...props}
			initial="hidden"
			animate="visible"
			viewBox="0 0 39 10"
			fill="currentColor"
		>
			<motion.path
				fill="currentColor"
				strokeWidth={strokeWidth}
				stroke="currentColor"
				strokeLinecap="round"
				variants={textVariants}
				custom={0.4}
				d="M3.108 9.144C2.396 9.144 1.804 8.964 1.332 8.604C0.859998 8.244 0.583998 7.756 0.503998 7.14H1.536C1.6 7.452 1.764 7.724 2.028 7.956C2.3 8.18 2.664 8.292 3.12 8.292C3.544 8.292 3.856 8.204 4.056 8.028C4.256 7.844 4.356 7.628 4.356 7.38C4.356 7.02 4.224 6.78 3.96 6.66C3.704 6.54 3.34 6.432 2.868 6.336C2.548 6.272 2.228 6.18 1.908 6.06C1.588 5.94 1.32 5.772 1.104 5.556C0.887998 5.332 0.779998 5.04 0.779998 4.68C0.779998 4.16 0.971998 3.736 1.356 3.408C1.748 3.072 2.276 2.904 2.94 2.904C3.572 2.904 4.088 3.064 4.488 3.384C4.896 3.696 5.132 4.144 5.196 4.728H4.2C4.16 4.424 4.028 4.188 3.804 4.02C3.588 3.844 3.296 3.756 2.928 3.756C2.568 3.756 2.288 3.832 2.088 3.984C1.896 4.136 1.8 4.336 1.8 4.584C1.8 4.824 1.924 5.012 2.172 5.148C2.428 5.284 2.772 5.4 3.204 5.496C3.572 5.576 3.92 5.676 4.248 5.796C4.584 5.908 4.856 6.08 5.064 6.312C5.28 6.536 5.388 6.864 5.388 7.296C5.396 7.832 5.192 8.276 4.776 8.628C4.368 8.972 3.812 9.144 3.108 9.144Z"
				// fill="currentColor"
			/>
			<motion.path
				fill="currentColor"
				strokeWidth={strokeWidth}
				stroke="currentColor"
				strokeLinecap="round"
				custom={0.5}
				variants={textVariants}
				d="M6.828 9V0.360001H7.836V5.556L10.272 3.048H11.508L8.868 5.736L11.844 9H10.56L7.836 5.916V9H6.828Z"
			/>
			<motion.path
				fill="currentColor"
				strokeWidth={strokeWidth}
				stroke="currentColor"
				strokeLinecap="round"
				variants={textVariants}
				custom={0.6}
				d="M15.1173 9.144C14.5493 9.144 14.0453 9.016 13.6053 8.76C13.1653 8.496 12.8173 8.132 12.5613 7.668C12.3133 7.204 12.1893 6.656 12.1893 6.024C12.1893 5.4 12.3133 4.856 12.5613 4.392C12.8093 3.92 13.1533 3.556 13.5933 3.3C14.0413 3.036 14.5573 2.904 15.1413 2.904C15.7173 2.904 16.2133 3.036 16.6293 3.3C17.0533 3.556 17.3773 3.896 17.6013 4.32C17.8253 4.744 17.9373 5.2 17.9373 5.688C17.9373 5.776 17.9333 5.864 17.9253 5.952C17.9253 6.04 17.9253 6.14 17.9253 6.252H13.1853C13.2093 6.708 13.3133 7.088 13.4973 7.392C13.6893 7.688 13.9253 7.912 14.2053 8.064C14.4933 8.216 14.7973 8.292 15.1173 8.292C15.5333 8.292 15.8813 8.196 16.1613 8.004C16.4413 7.812 16.6453 7.552 16.7733 7.224H17.7693C17.6093 7.776 17.3013 8.236 16.8453 8.604C16.3973 8.964 15.8213 9.144 15.1173 9.144ZM15.1173 3.756C14.6373 3.756 14.2093 3.904 13.8333 4.2C13.4653 4.488 13.2533 4.912 13.1973 5.472H16.9413C16.9173 4.936 16.7333 4.516 16.3893 4.212C16.0453 3.908 15.6213 3.756 15.1173 3.756Z"
			/>
			<motion.path
				fill="currentColor"
				strokeWidth={strokeWidth}
				stroke="currentColor"
				strokeLinecap="round"
				variants={textVariants}
				custom={0.7}
				d="M21.4261 9C20.8821 9 20.4541 8.868 20.1421 8.604C19.8301 8.34 19.6741 7.864 19.6741 7.176V3.9H18.6421V3.048H19.6741L19.8061 1.62H20.6821V3.048H22.4341V3.9H20.6821V7.176C20.6821 7.552 20.7581 7.808 20.9101 7.944C21.0621 8.072 21.3301 8.136 21.7141 8.136H22.3381V9H21.4261Z"
			/>
			<motion.path
				fill="currentColor"
				strokeWidth={strokeWidth}
				stroke="currentColor"
				strokeLinecap="round"
				variants={textVariants}
				custom={0.7}
				d="M26.2867 9.144C25.7187 9.144 25.2067 9.016 24.7507 8.76C24.3027 8.496 23.9467 8.132 23.6827 7.668C23.4267 7.196 23.2987 6.648 23.2987 6.024C23.2987 5.4 23.4267 4.856 23.6827 4.392C23.9467 3.92 24.3027 3.556 24.7507 3.3C25.2067 3.036 25.7187 2.904 26.2867 2.904C26.9907 2.904 27.5827 3.088 28.0627 3.456C28.5507 3.824 28.8587 4.316 28.9867 4.932H27.9547C27.8747 4.564 27.6787 4.28 27.3667 4.08C27.0547 3.872 26.6907 3.768 26.2747 3.768C25.9387 3.768 25.6227 3.852 25.3267 4.02C25.0307 4.188 24.7907 4.44 24.6067 4.776C24.4227 5.112 24.3307 5.528 24.3307 6.024C24.3307 6.52 24.4227 6.936 24.6067 7.272C24.7907 7.608 25.0307 7.864 25.3267 8.04C25.6227 8.208 25.9387 8.292 26.2747 8.292C26.6907 8.292 27.0547 8.192 27.3667 7.992C27.6787 7.784 27.8747 7.492 27.9547 7.116H28.9867C28.8667 7.716 28.5627 8.204 28.0747 8.58C27.5867 8.956 26.9907 9.144 26.2867 9.144Z"
			/>
			<motion.path
				fill="currentColor"
				strokeWidth={strokeWidth}
				stroke="currentColor"
				strokeLinecap="round"
				variants={textVariants}
				custom={0.8}
				d="M30.3944 9V0.360001H31.4024V4.068C31.6024 3.7 31.8864 3.416 32.2544 3.216C32.6224 3.008 33.0224 2.904 33.4544 2.904C34.1424 2.904 34.6944 3.12 35.1104 3.552C35.5264 3.976 35.7344 4.632 35.7344 5.52V9H34.7384V5.628C34.7384 4.388 34.2384 3.768 33.2384 3.768C32.7184 3.768 32.2824 3.956 31.9304 4.332C31.5784 4.7 31.4024 5.228 31.4024 5.916V9H30.3944Z"
			/>
		</motion.svg>
	);
}

const numberVariants = {
	initial: { opacity: 0, y: -100 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: 100 },
};

function Number({ number }: { number: number }) {
	return (
		<motion.div
			className="text-9xl font-medium absolute top-1/2 left-1/2 w-min flex flex-col items-center justify-center z-10"
			layout
			initial="initial"
			animate="animate"
			exit="exit"
			variants={numberVariants}
			transition={{
				type: "spring",
				stiffness: 500,
				damping: 50,
				mass: 1,
			}}
		>
			<span className="text-7xl absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 flex flex-col items-center justify-center">
				{number || <AnimatedSketchText className=" h-[4.5rem] text-black" />}
			</span>
		</motion.div>
	);
}

function getTimeLeft(startsAt: string) {
	return new Date(startsAt).getTime() - Date.now();
}

export function GameStartCountdown() {
	const { room } = useRoomContext();
	const [countdown, setCountdown] = useState(
		Math.ceil((getTimeLeft(room.game.startsAt) - 2000) / 1000)
	);

	useEffect(() => {
		const interval = setInterval(() => {
			const timeLeft = Math.ceil(
				(getTimeLeft(room.game.startsAt) - 2000) / 1000
			);

			if (timeLeft >= 0) {
				setCountdown(timeLeft);
			}
		}, 1000);
		return () => clearInterval(interval);
	}, [room.game.startsAt]);

	return (
		<motion.div
			key="countdown"
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{
				type: "spring",
				stiffness: 500,
				damping: 50,
				mass: 1,
			}}
			className="h-full w-full absolute inset-0 overflow-hidden z-10"
		>
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-3xl w-full h-[500px] bg-secondary/95 blur-[100px]" />

			<AnimatePresence mode="popLayout">
				<Number key={countdown} number={countdown} />
			</AnimatePresence>
		</motion.div>
	);
}
