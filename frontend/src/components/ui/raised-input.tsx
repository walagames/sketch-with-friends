import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
export function RaisedInput({
	placeholder,
	className,
	...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
	return (
		<div className="bg-secondary-foreground rounded-lg w-full">
			<Input
				{...props}
				autoComplete="off"
				placeholder={placeholder}
				className={cn(
					"font-bold text-xl text-foreground placeholder:text-zinc-400 bg-background rounded-lg h-14 px-4 py-3.5 w-full -translate-y-1.5 translate-x-1.5",
					className
				)}
			/>
		</div>
	);
}
