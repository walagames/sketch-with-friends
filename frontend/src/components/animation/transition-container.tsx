import { motion } from "framer-motion";
import { useDirectionAnimation } from "@/hooks/use-direction-animation";

export function TransitionContainer({
	children,
}: {
	children: React.ReactNode;
}) {
	const animationProps = useDirectionAnimation();
	return (
		<motion.div className="absolute inset-0" {...animationProps}>
			{children}
		</motion.div>
	);
}
