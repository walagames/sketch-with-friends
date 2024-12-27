import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, forwardRef } from "react";
import { SoundEffect, useSound } from "@/providers/sound-provider";

const textVariants = {
	hidden: { pathLength: 0, y: 25, x: 15, fillOpacity: 0, opacity: 0 },
	visible: (i: number) => {
		const delay = (i - 0.4) * 0.5 + 0.25;
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
	exit: (i: number) => {
		const delay = i * 0.2;
		return {
			opacity: 0,
			pathLength: 0,
			y: 2,
			x: -3,
			fillOpacity: 0,
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
					delay: delay + 0.25,
				},
				x: {
					type: "spring",
					stiffness: 500,
					damping: 50,
					mass: 1,
					delay: delay + 0.5,
				},
				y: {
					type: "spring",
					stiffness: 500,
					damping: 50,
					mass: 1,
					delay: delay + 0.5,
				},
			},
		};
	},
};

export const AnimatedSketchText = forwardRef<
	SVGSVGElement,
	React.ComponentProps<typeof motion.svg>
>((props, ref) => {
	const play = useSound();
	useEffect(() => {
		const timeout = setTimeout(() => {
			play(SoundEffect.SCRIBBLE);
		}, 1200);
		return () => clearTimeout(timeout);
	}, []);

	const strokeWidth = "0.16px";
	return (
		<motion.svg
			{...props}
			ref={ref}
			initial="hidden"
			animate="visible"
			exit="exit"
			fill="currentColor"
			viewBox="0 0 242 56"
		>
			<motion.path
				fill="currentColor"
				strokeWidth={strokeWidth}
				stroke="currentColor"
				strokeLinecap="round"
				variants={textVariants}
				custom={0.4}
				d="M184.817 55V0.296875H198.563V8.06641C198.563 11.043 198.493 13.5273 198.352 15.5195C198.212 17.5117 198.095 19.0352 198.001 20.0898H198.634C199.946 18.0273 201.493 16.5742 203.274 15.7305C205.079 14.8867 207.188 14.4648 209.602 14.4648C212.204 14.4648 214.559 14.9688 216.669 15.9766C218.802 16.9844 220.501 18.5547 221.766 20.6875C223.055 22.8203 223.7 25.6211 223.7 29.0898V55H209.884V33.2734C209.884 27.9297 208.302 25.2578 205.138 25.2578C202.63 25.2578 200.907 26.3125 199.97 28.4219C199.032 30.5312 198.563 33.5547 198.563 37.4922V55H184.817Z"
			/>
			<motion.path
				fill="currentColor"
				strokeWidth={strokeWidth}
				stroke="currentColor"
				strokeLinecap="round"
				variants={textVariants}
				custom={0.5}
				d="M168.465 55.7031C162.418 55.7031 157.59 54.0742 153.981 50.8164C150.395 47.5586 148.602 42.3789 148.602 35.2773C148.602 30.4492 149.516 26.5117 151.344 23.4648C153.172 20.3945 155.657 18.1328 158.797 16.6797C161.938 15.2031 165.524 14.4648 169.555 14.4648C171.993 14.4648 174.301 14.7461 176.481 15.3086C178.684 15.8477 180.723 16.5742 182.598 17.4883L178.555 27.6484C176.915 26.9219 175.368 26.3477 173.915 25.9258C172.485 25.4805 171.032 25.2578 169.555 25.2578C167.493 25.2578 165.805 26.0781 164.493 27.7188C163.204 29.3359 162.559 31.832 162.559 35.207C162.559 38.6523 163.204 41.1133 164.493 42.5898C165.805 44.043 167.516 44.7695 169.625 44.7695C171.594 44.7695 173.575 44.4648 175.567 43.8555C177.559 43.2227 179.446 42.3555 181.227 41.2539V52.1875C179.54 53.2891 177.676 54.1562 175.637 54.7891C173.598 55.3984 171.208 55.7031 168.465 55.7031Z"
			/>
			<motion.path
				fill="currentColor"
				strokeWidth={strokeWidth}
				stroke="currentColor"
				strokeLinecap="round"
				variants={textVariants}
				custom={0.6}
				d="M141.039 44.8398C142.234 44.8398 143.359 44.7109 144.414 44.4531C145.469 44.1953 146.547 43.8672 147.649 43.4688V53.4883C146.172 54.1211 144.59 54.6484 142.902 55.0703C141.215 55.4922 139.082 55.7031 136.504 55.7031C133.856 55.7031 131.57 55.293 129.649 54.4727C127.68 53.6523 126.156 52.2578 125.078 50.2891C124 48.2969 123.461 45.4961 123.461 41.8867V25.4688H118.645V19.8789L124.762 15.5547L128.277 7.1875H137.277V15.168H147.086V25.4688H137.277V40.9727C137.277 43.5508 138.531 44.8398 141.039 44.8398Z"
			/>
			<motion.path
				fill="currentColor"
				strokeWidth={strokeWidth}
				stroke="currentColor"
				strokeLinecap="round"
				variants={textVariants}
				custom={0.7}
				d="M99.2694 14.4648C105.082 14.4648 109.664 15.9766 113.016 19C116.391 22.0234 118.078 26.582 118.078 32.6758V38.793H93.5038C93.5975 40.8555 94.371 42.5664 95.8241 43.9258C97.3007 45.2617 99.4335 45.9297 102.223 45.9297C104.73 45.9297 107.016 45.6953 109.078 45.2266C111.141 44.7344 113.273 43.9609 115.476 42.9062V52.7852C113.555 53.793 111.445 54.5312 109.148 55C106.875 55.4688 104.016 55.7031 100.57 55.7031C96.5389 55.7031 92.953 55 89.8124 53.5938C86.6718 52.1875 84.1874 49.9844 82.3593 46.9844C80.5311 43.9844 79.6171 40.1055 79.6171 35.3477C79.6171 30.6133 80.4491 26.6875 82.1132 23.5703C83.7772 20.4766 86.0741 18.1914 89.0038 16.7148C91.9569 15.2148 95.3788 14.4648 99.2694 14.4648ZM99.7616 23.8164C98.1444 23.8164 96.7968 24.3203 95.7186 25.3281C94.6405 26.3359 93.996 27.9414 93.785 30.1445H105.598C105.551 28.3867 105.035 26.8984 104.051 25.6797C103.066 24.4375 101.637 23.8164 99.7616 23.8164Z"
			/>
			<motion.path
				fill="currentColor"
				strokeWidth={strokeWidth}
				stroke="currentColor"
				strokeLinecap="round"
				variants={textVariants}
				custom={0.7}
				d="M39.6753 55V0.296875H53.4917V21.8125C53.4917 23.4531 53.4214 25.2578 53.2808 27.2266C53.1401 29.1719 52.9526 30.9648 52.7183 32.6055H52.9995C52.9995 32.6055 53.0581 32.5234 53.1753 32.3594C53.2925 32.1719 53.4683 31.8906 53.7026 31.5156C54.1714 30.8125 54.7339 29.9805 55.3901 29.0195C56.0464 28.0586 56.6675 27.1914 57.2534 26.418L66.1831 15.168H81.5112L67.6948 32.1133L82.355 55H66.6753L57.9565 40.7266L53.4917 44.1367V55H39.6753Z"
			/>
			<motion.path
				fill="currentColor"
				strokeWidth={strokeWidth}
				stroke="currentColor"
				strokeLinecap="round"
				variants={textVariants}
				custom={0.7}
				d="M36.8586 39.3906C36.8586 42.2031 36.1555 44.8398 34.7492 47.3008C33.3195 49.7852 31.1281 51.8125 28.175 53.3828C25.2219 54.9297 21.4016 55.7031 16.7141 55.7031C14.3469 55.7031 12.2961 55.5977 10.5617 55.3867C8.80389 55.1758 7.15155 54.8359 5.60468 54.3672C4.08124 53.875 2.49921 53.2422 0.858582 52.4688V40.0938C3.64764 41.4766 6.44843 42.543 9.26093 43.293C12.0969 44.043 14.675 44.418 16.9953 44.418C19.0578 44.418 20.5695 44.0664 21.5305 43.3633C22.4914 42.6367 22.9719 41.7109 22.9719 40.5859C22.9719 39.2266 22.2687 38.1484 20.8625 37.3516C20.1359 36.9531 19.175 36.4609 17.9797 35.875C16.7844 35.2656 15.3547 34.5859 13.6906 33.8359C12.4016 33.25 11.2062 32.6523 10.1047 32.043C9.00311 31.4102 7.98358 30.7539 7.04608 30.0742C5.17108 28.7383 3.72968 27.1094 2.72186 25.1875C1.71405 23.2656 1.21014 20.8398 1.21014 17.9102C1.21014 14.582 2.03046 11.8164 3.67108 9.61328C5.31171 7.38672 7.57343 5.71094 10.4562 4.58594C13.3625 3.4375 16.7375 2.86328 20.5812 2.86328C23.9562 2.86328 26.9797 3.25 29.6516 4.02344C32.3469 4.79688 34.7492 5.64062 36.8586 6.55469L32.6047 17.2773C30.4016 16.2695 28.2336 15.4727 26.1008 14.8867C23.968 14.2773 21.9875 13.9727 20.1594 13.9727C18.3312 13.9727 17.007 14.2891 16.1867 14.9219C15.3664 15.5312 14.9562 16.3164 14.9562 17.2773C14.9562 18.0977 15.2726 18.8125 15.9055 19.4219C16.5383 20.0547 17.7219 20.8047 19.4562 21.6719C21.2141 22.5391 23.0773 23.4297 25.0461 24.3438C26.2883 24.9297 27.4484 25.5273 28.5266 26.1367C29.6047 26.7227 30.5773 27.3438 31.4445 28C33.1789 29.2891 34.5148 30.8477 35.4523 32.6758C36.3898 34.5039 36.8586 36.7422 36.8586 39.3906Z"
			/>
			<motion.path
				fill="currentColor"
				strokeWidth={strokeWidth}
				stroke="currentColor"
				strokeLinecap="round"
				variants={textVariants}
				custom={0.7}
				d="M226.552 3.60156H241.739L239.946 36.8594H228.345L226.552 3.60156ZM226.692 49.1641C226.692 46.6797 227.419 44.9336 228.872 43.9258C230.349 42.918 232.095 42.4141 234.11 42.4141C236.079 42.4141 237.778 42.918 239.208 43.9258C240.661 44.9336 241.388 46.6797 241.388 49.1641C241.388 51.5078 240.661 53.2188 239.208 54.2969C237.778 55.3516 236.079 55.8789 234.11 55.8789C232.095 55.8789 230.349 55.3516 228.872 54.2969C227.419 53.2188 226.692 51.5078 226.692 49.1641Z"
			/>
		</motion.svg>
	);
});

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
				{number || <AnimatedSketchText className=" h-[4rem] text-black" />}
			</span>
		</motion.div>
	);
}

export function GameStartCountdown() {
	const [countdown, setCountdown] = useState(3);

	useEffect(() => {
		const interval = setInterval(() => {
			if (countdown > 0) {
				setCountdown((prev) => prev - 1);
			}
		}, 1000);
		return () => clearInterval(interval);
	}, [countdown]);

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
			{/* <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-3xl w-full h-[500px] bg-secondary/95 blur-[100px]" /> */}

			<AnimatePresence mode="popLayout">
				<Number key={countdown} number={countdown} />
			</AnimatePresence>
		</motion.div>
	);
}
