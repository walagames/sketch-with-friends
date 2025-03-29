import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type RaisedInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
	sizeVariant?: "md" | "lg";
};

export const RaisedInput = forwardRef<HTMLInputElement, RaisedInputProps>(
	({ placeholder, className, sizeVariant = "lg", ...props }, ref) => {
		return (
			<div className="bg-secondary-foreground rounded-lg w-full mr-0.5">
				<Input
					{...props}
					ref={ref}
					autoComplete="off"
					placeholder={placeholder}
					className={cn(
						"font-bold text-base text-foreground placeholder:text-zinc-400 bg-background rounded-lg lg:h-1 h-12 px-4 py-3.5 w-full -translate-y-1.5 translate-x-1.5",
						sizeVariant === "md" ? "lg:h-13 h-12" : "lg:h-14 h-12 text-lg",
						className
					)}
				/>
			</div>
		);
	}
);

RaisedInput.displayName = "RaisedInput";
