import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "framer-motion";
import useSound from "use-sound";

const buttonVariants = cva(
	"inline-flex items-center justify-center rounded-lg font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:brightness-90 disabled:pointer-events-none ring-offset-background",
	{
		variants: {
			variant: {
				default: "bg-background text-foreground",
				icon: "bg-transparent hover:bg-accent hover:text-accent-foreground",
				action: "bg-primary text-background text-xl",
			},
			size: {
				default: "h-10 py-4 px-4",
				sm: "h-9 px-3 rounded-md",
				lg: "h-11 px-6 rounded-md",
				xl: "py-1 px-16",
				icon: "lg:h-11 lg:w-11 h-10 w-10",
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

// const spriteMap = {
// 	blip1: [0, 1000],
// 	blip2: [2000, 1000],
// 	blip3: [4000, 1000],
// 	blip4: [6000, 1000],
// 	blip5: [8000, 1000],
// 	blip6: [10000, 1000],
// 	blip7: [12000, 1000],
// 	blip8: [14000, 1000],
// 	blip9: [16000, 1000],
// 	blip10: [18000, 1000],
// 	blip11: [20040, 200],
// 	blip12: [22000, 1000],
// 	blip13: [24000, 1000],
// 	blip14: [26000, 1000],
// 	blip15: [28000, 1000],
// 	blip16: [30000, 1000],
// 	blip17: [32000, 1000],
// 	blip18: [34000, 1000],
// 	blip19: [36050, 110],
// 	blip20: [38000, 1000],
// 	blip21: [40000, 1000],
// 	blip22: [42000, 1000],
// 	blip23: [44000, 1000],
// 	blip24: [46000, 1000],
// 	blip25: [48000, 1000],
// 	blip26: [50000, 1000],
// 	blip27: [52000, 1000],
// 	blip28: [54000, 1000],
// 	blip29: [56000, 1000],
// 	blip30: [58000, 1000],
// 	blip31: [60000, 1000],
// };

const clickSprite = {
	click: [25, 500],
};

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
		// const [play] = useSound("/sounds.mp3", {
		// 	sprite: spriteMap,
		// 	volume: 0.01,
		// });
		const [play] = useSound("/click-pop.mp3", {
			volume: 0.05,
			sprite: clickSprite,
		});

		const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
			// 1, 3, 5, 8, 9, 11, 16, 18, 19, 20, 27, 31
			play({ id: "click" });
			// Call the original onClick handler if it exists
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
