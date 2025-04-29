import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
	React.ElementRef<typeof SliderPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
		trackStyles?: React.CSSProperties;
		thumbStyles?: React.CSSProperties;
	}
>(({ className, trackStyles, thumbStyles, orientation = "horizontal", ...props }, ref) => (
	<SliderPrimitive.Root
		ref={ref}
		className={cn(
			"relative flex touch-none select-none",
			orientation === "horizontal" ? "w-full items-center" : "h-full flex-col items-center",
			className
		)}
		orientation={orientation}
		{...props}
	>
		<SliderPrimitive.Track
			className={cn(
				"relative grow overflow-hidden bg-muted-foreground rounded-full",
				orientation === "horizontal" ? "h-4 w-full" : "h-full w-4"
			)}
			style={trackStyles}
		>
			<SliderPrimitive.Range className={cn(
				"absolute",
				orientation === "horizontal" ? "h-full" : "w-full"
			)} />
		</SliderPrimitive.Track>
		<SliderPrimitive.Thumb 
			className="block h-8 w-8 rounded-lg border-4 border-muted-foreground bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
			style={thumbStyles}
		/>
	</SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
