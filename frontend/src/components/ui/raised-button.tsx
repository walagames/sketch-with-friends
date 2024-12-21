import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "framer-motion";
import { useSound, SoundEffect } from "@/providers/sound-provider";

const buttonVariants = cva(
	"inline-flex items-center duration-150 justify-center font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:brightness-90 disabled:pointer-events-none ring-offset-background",
	{
		variants: {
			variant: {
				default:
					"bg-background text-foreground hover:bg-primary hover:text-background",
				basic:
					"bg-background text-foreground hover:bg-zinc-200 hover:text-foreground",
				icon: "bg-transparent hover:bg-accent hover:text-accent-foreground",
				action: "bg-primary text-background text-xl active:bg-primary-muted",
				card: "bg-background text-foreground",
			},
			size: {
				default: "h-10 py-4 px-4",
				sm: "h-9 px-3",
				lg: "h-11 px-6",
				xl: "py-1 px-16",
				icon: "h-10 lg:h-11 w-10 lg:w-11",
				iconSm: "h-9 w-9",
				iconMd: "h-11 w-11",
				tall: "h-full w-12",
				wide: "w-full h-12",
				card: "h-14 px-0 py-0",
			},
			rounded: {
				default: "rounded-lg",
				none: "rounded-none",
				sm: "rounded-sm",
				md: "rounded-md",
				lg: "rounded-lg",
				xl: "rounded-xl",
				full: "rounded-full",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
			rounded: "lg",
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
	offset?: "default" | "small" | "md";
	rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
}

const RaisedButton = React.forwardRef<HTMLButtonElement, RaisedButtonProps>(
	(
		{
			className,
			variant,
			size,
			shift = true,
			onClick,
			offset,
			rounded = "lg",
			...props
		},
		ref
	) => {
		const playSound = useSound();

		const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
			playSound(SoundEffect.CLICK);
			onClick?.(e);
		};

		const offsets = {
			default: { x: 5, y: -5 },
			small: { x: 3, y: -3 },
			md: { x: 4, y: -4 },
		};

		const offsetValues = offsets[offset || "default"];

		return (
			<div
				className={cn(
					"flex items-center gap-3 bg-secondary-foreground",
					`rounded-${rounded}`,
					(size === "tall" || size === "card") && "flex-1"
				)}
			>
				<motion.button
					className={cn(buttonVariants({ variant, size, rounded, className }))}
					ref={ref}
					onClick={handleClick}
					style={{
						y: offsetValues?.y,
						x: offsetValues?.x,
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
