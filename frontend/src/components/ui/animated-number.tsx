"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

export function AnimatedNumber({
	previous,
	value,
	delay = 300,
}: {
	previous: number;
	value: number;
	delay?: number;
}) {
	const spring = useSpring(previous, { mass: 0.8, stiffness: 75, damping: 15 });
	const display = useTransform(spring, (current) =>
		Math.round(current).toLocaleString()
	);

	useEffect(() => {
		const timeout = setTimeout(() => {
			spring.set(value);
		}, delay);

		return () => clearTimeout(timeout);
	}, [spring, value, previous, delay]);

	return <motion.span>{display}</motion.span>;
}
