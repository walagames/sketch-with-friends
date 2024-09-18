"use client";
// Based off https://buildui.com/recipes/animated-counter by Sam Selikoff
import { cn } from "@/lib/utils";
import { MotionValue, motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

function getColorForTime(time: number): string {
	if (time <= 5) return "text-red-500";
	if (time <= 10) return "text-yellow-500";
	return "text-foreground";
}

const fontSize = 24;
const padding = 18;
const height = fontSize + padding;

export default function CountdownTimer({ endTime }: { endTime: number }) {
	let [count, setCount] = useState(Math.ceil((endTime - Date.now()) / 1000));

	useEffect(() => {
		// This function runs only if count is greater than 0.
		if (count > 0) {
			const interval = setInterval(() => {
				setCount((prevCount) => prevCount - 1);
			}, 1000);
			return () => clearInterval(interval);
		}
	}, [count]); // Dependency on count to check it on each decrement.
	return (
		<div
			style={{ fontSize }}
			className={cn(
				"flex overflow-hidden rounded-lg border border-input bg-background px-2 leading-none relative border=-nput"
			)}
		>
			<Digit place={10} value={count} color={getColorForTime(count)} />
			<Digit place={1} value={count} color={getColorForTime(count)} />
		</div>
	);
}

function Digit({
	place,
	value,
	color,
}: {
	place: number;
	value: number;
	color: string;
}) {
	let valueRoundedToPlace = Math.floor(value / place);
	let animatedValue = useSpring(valueRoundedToPlace, {
		stiffness: 700,
		damping: 50,
		mass: 1,
	});

	useEffect(() => {
		animatedValue.set(valueRoundedToPlace);
	}, [animatedValue, valueRoundedToPlace]);

	return (
		<div style={{ height }} className="relative w-[1ch] tabular-nums">
			{Array.from({ length: 10 }, (_, i) => (
				<Number key={i} mv={animatedValue} number={i} color={color} />
			))}
		</div>
	);
}

function Number({
	mv,
	number,
	color,
}: {
	mv: MotionValue;
	number: number;
	color: string;
}) {
	let y = useTransform(mv, (latest) => {
		let placeValue = latest % 10;
		let offset = (10 + number - placeValue) % 10;

		let memo = offset * height;

		if (offset > 5) {
			memo -= 10 * height;
		}

		return memo;
	});

	return (
		<motion.span
			style={{ y }}
			className={`absolute inset-0 flex items-center justify-center ${color}`}
		>
			{number}
		</motion.span>
	);
}
