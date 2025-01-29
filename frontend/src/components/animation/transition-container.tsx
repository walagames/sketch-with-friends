import { motion } from "framer-motion";
import { useTransitionVariants } from "@/hooks/use-transition-variants";
import { cn } from "@/lib/utils";

export function TransitionContainer({
	children,
	className,
	zIndex,
}: {
	children: React.ReactNode;
	className?: string;
	zIndex?: number;
}) {
	const animationProps = useTransitionVariants();
	return (
		<motion.div
			className={cn("absolute inset-0 bg-background-secondary", className)}
			{...animationProps}
			style={{ zIndex: zIndex }}
		>
			{children}
		</motion.div>
	);
}
