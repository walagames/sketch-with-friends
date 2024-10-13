import { cn } from "@/lib/utils";

export function Hills({ className }: { className?: string }) {
	return (
		<div className={cn("", className)}>
			<div className="absolute -bottom-36 left-0 w-full bg-[#aef1fe]">
				<img src="/hill-right.svg" alt="footer" className="w-full" />
			</div>
			<div className="absolute -bottom-36 -translate-y-[15px] left-0 w-full">
				<img src="/hill-left.svg" alt="footer" className="w-full" />
			</div>
		</div>
	);
}
