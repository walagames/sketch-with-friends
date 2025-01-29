import { SceneSprites } from "@/hooks/use-view-transition";
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
			<SceneSprites />
		</div>
	);
}
