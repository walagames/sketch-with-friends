import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function RoomScene({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex h-full flex-col items-center justify-center w-full relative",
				className
			)}
		>
			{children}
			<AnimatePresence>
				<BobbingDoodle
					hideOnSmallViewports
					duration={5}
					style={{ top: "8%", left: "12%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					hideOnSmallViewports
					duration={4}
					style={{ top: "24%", right: "10%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					className="absolute lg:hidden w-28"
					duration={4}
					style={{ bottom: "24%", right: "16%" }}
					src="/doodles/rain-cloud.png"
				/>
			</AnimatePresence>
		</div>
	);
}
