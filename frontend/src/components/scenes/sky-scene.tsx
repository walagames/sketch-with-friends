import { cn } from "@/lib/utils";
export function SkyScene({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex h-full flex-col items-center justify-center w-full gap-6 lg:gap-8 relative",
				className
			)}
		>
			{children}
			<Hills />
		</div>
	);
}

export function Hills({ className }: { className?: string }) {
	return (
		<div className={cn("", className)}>
			<svg
				className="absolute lg:-bottom-18 2xl:-bottom-36 xl:-bottom-24 md:-bottom-12 bottom-0 left-0 w-full bg-[#aef1fe] translate-y-[3px] lg:translate-y-0"
				viewBox="0 0 1163 173"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M2229 211C2229 222.53 2222.37 234.09 2209.03 245.558C2195.71 257.015 2175.95 268.159 2150.31 278.828C2099.05 300.161 2024.75 319.416 1932.78 335.602C1748.89 367.969 1494.76 388 1214 388C933.306 388 605.303 351.765 361.17 307.158C239.086 284.851 138.077 260.468 74.4672 237.509C42.5817 226.001 20.3972 214.952 9.57824 204.882C4.15921 199.838 1.98283 195.405 2.28812 191.581C2.58487 187.865 5.29663 183.926 11.6552 179.946C197.547 162.145 374.665 125.035 545.21 89.3017C566.607 84.8186 587.9 80.3572 609.094 75.9583C799.415 36.4565 981.73 2 1159.5 2C1440.22 2 1707.96 30.0248 1905.48 70.3874C2004.25 90.5714 2085.38 113.824 2141.77 138.161C2169.98 150.334 2191.89 162.735 2206.72 175.087C2221.59 187.48 2229 199.536 2229 211Z"
					fill="hsl(var(--hills))"
					stroke="#39332D"
					strokeWidth="4"
				/>
			</svg>
			<svg
				className="absolute lg:-bottom-18 2xl:-bottom-36 xl:-bottom-24 md:-bottom-12 lg:-translate-y-[13px] bottom-0 left-0 w-full"
				viewBox="0 0 1221 173"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M1218.9 176.995C1217.89 187.605 1208.8 198.454 1191.79 209.347C1173.84 220.837 1147.68 231.976 1115 242.617C1049.67 263.89 958.727 283.031 856.43 299.096C651.855 331.224 402.209 351 222 351C41.8049 351 -121.259 330.977 -239.212 298.643C-298.203 282.473 -345.797 263.254 -378.596 241.997C-411.483 220.683 -429 197.66 -429 174C-429 149.559 -424.098 126.75 -411.27 106.245C-398.441 85.7382 -377.579 67.3675 -345.379 51.9825C-280.886 21.1688 -171.269 2.5 9 2.5C189.096 2.5 433.652 46.0811 662.491 89.7146C687.372 94.4587 712.066 99.2033 736.471 103.892C824.253 120.758 908.28 136.902 983.709 149.706C1078.93 165.871 1160.6 176.739 1218.9 176.995Z"
					fill="hsl(var(--hills))"
					stroke="#39332D"
					strokeWidth="4"
				/>
			</svg>
		</div>
	);
}
