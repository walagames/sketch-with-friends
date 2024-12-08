import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "framer-motion";
import { useSound, SoundEffect } from "@/providers/sound-provider";

const buttonVariants = cva(
	"inline-flex items-center duration-150 justify-center rounded-lg font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:brightness-90 disabled:pointer-events-none ring-offset-background",
	{
		variants: {
			variant: {
				default:
					"bg-background text-foreground hover:bg-primary hover:text-background",
				icon: "bg-transparent hover:bg-accent hover:text-accent-foreground",
				action: "bg-primary text-background text-xl",
			},
			size: {
				default: "h-10 py-4 px-4",
				sm: "h-9 px-3 rounded-md",
				lg: "h-11 px-6 rounded-md",
				xl: "py-1 px-16",
				icon: "h-11 w-11",
				iconSm: "h-9 w-9",
				tall: "h-full w-12",
				wide: "w-full h-12",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

interface RaisedButtonProps extends ButtonProps {
	shift?: boolean;
}

const RaisedButton = React.forwardRef<HTMLButtonElement, RaisedButtonProps>(
	({ className, variant, size, shift = true, onClick, ...props }, ref) => {
		const playSound = useSound();

		const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
			playSound(SoundEffect.CLICK);
			onClick?.(e);
		};

		return (
			<div
				className={cn(
					"flex items-center gap-3 bg-secondary-foreground rounded-lg",
					size === "tall" && "flex-1"
				)}
			>
				<motion.button
					className={cn(buttonVariants({ variant, size, className }))}
					ref={ref}
					onClick={handleClick}
					style={{
						y: -5,
						x: 5,
					}}
					whileTap={{
						y: 0,
						x: 0,
					}}
					{...(props as HTMLMotionProps<"button">)}
				>
					<span
						className={cn(
							"block py-2 whitespace-nowrap",
							shift && "translate-y-0.5"
						)}
					>
						{props.children}
					</span>
				</motion.button>
			</div>
		);
	}
);
RaisedButton.displayName = "RaisedButton";

export { RaisedButton, buttonVariants };
