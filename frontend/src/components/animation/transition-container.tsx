import { motion } from "framer-motion";
import { useTransitionVariants } from "@/hooks/use-transition-variants";

export function TransitionContainer({
	children,
}: {
	children: React.ReactNode;
}) {
	const animationProps = useTransitionVariants();
	return (
		<motion.div className="absolute inset-0" {...animationProps}>
			{children}
		</motion.div>
	);
}
