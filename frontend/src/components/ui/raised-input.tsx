import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const RaisedInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ placeholder, className, ...props }, ref) => {
	return (
		<div className="bg-secondary-foreground rounded-lg w-full mr-0.5">
			<Input
				{...props}
				ref={ref}
				autoComplete="off"
				placeholder={placeholder}
				className={cn(
					"font-bold text-lg lg:text-xl text-foreground placeholder:text-zinc-400 bg-background rounded-lg lg:h-14 h-12 px-4 py-3.5 w-full -translate-y-1.5 translate-x-1.5",
					className
				)}
			/>
		</div>
	);
});

RaisedInput.displayName = "RaisedInput";
