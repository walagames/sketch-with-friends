import { motion, AnimatePresence } from "framer-motion";
import { Player, PlayerRole } from "@/types/player";
import { generateAvatar } from "@/lib/avatar";

const CrownIcon = (props: React.SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width={24}
		height={24}
		color={"#f8e71c"}
		fill={"none"}
		{...props}
	>
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M11.9998 1C11.2796 1 10.8376 1.5264 10.5503 1.97988C10.2554 2.4452 9.95117 3.1155 9.59009 3.91103L9.59009 3.91103C9.44988 4.2199 9.31383 4.53229 9.17756 4.84518C8.86046 5.57329 8.54218 6.30411 8.16755 6.99964C7.88171 7.53032 7.37683 7.83299 6.76135 7.61455C6.52927 7.53218 6.23722 7.40295 5.79615 7.20692C5.69004 7.15975 5.57926 7.10711 5.46493 7.05277C4.85848 6.76458 4.15216 6.42892 3.51264 6.61189C2.88386 6.79179 2.43635 7.31426 2.28943 7.92532C2.20015 8.29667 2.27799 8.67764 2.36923 9.00553C2.46354 9.3445 2.61703 9.76929 2.80214 10.2816L2.80216 10.2816L4.49446 14.9652L4.49447 14.9652L4.49448 14.9653C4.83952 15.9202 5.11802 16.691 5.40655 17.2893C5.99655 18.5128 6.92686 19.2598 8.2897 19.4248C8.91068 19.5 9.67242 19.5 10.5984 19.5H13.4012C14.3272 19.5 15.089 19.5 15.7099 19.4248C17.0728 19.2598 18.0031 18.5128 18.5931 17.2893C18.8816 16.691 19.1601 15.9202 19.5052 14.9651L21.1975 10.2816L21.1975 10.2815C21.3826 9.76926 21.5361 9.34449 21.6304 9.00553C21.7216 8.67764 21.7995 8.29667 21.7102 7.92532C21.5633 7.31426 21.1158 6.79179 20.487 6.61189C19.8539 6.43075 19.15 6.76336 18.5495 7.04714C18.4411 7.09835 18.3361 7.14797 18.2355 7.19269C18.174 7.22 18.1126 7.24761 18.0512 7.27524C17.7834 7.39565 17.5147 7.51644 17.2383 7.61455C16.6228 7.83299 16.1179 7.53032 15.8321 6.99964C15.4574 6.3041 15.1392 5.57327 14.8221 4.84515C14.6858 4.53226 14.5497 4.21987 14.4095 3.911L14.4095 3.91099C14.0485 3.11548 13.7442 2.44519 13.4494 1.97988C13.162 1.5264 12.72 1 11.9998 1ZM11.999 13C11.1743 13 10.5057 13.6716 10.5057 14.5C10.5057 15.3284 11.1743 16 11.999 16H12.0124C12.8372 16 13.5057 15.3284 13.5057 14.5C13.5057 13.6716 12.8372 13 12.0124 13H11.999Z"
			fill="currentColor"
		/>
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M5.99976 21.9998C5.99976 21.4475 6.44747 20.9998 6.99976 20.9998H16.9998C17.552 20.9998 17.9998 21.4475 17.9998 21.9998C17.9998 22.552 17.552 22.9998 16.9998 22.9998H6.99976C6.44747 22.9998 5.99976 22.552 5.99976 21.9998Z"
			fill="currentColor"
		/>
	</svg>
);

const verticalVariants = {
	initial: { opacity: 0, x: -25 },
	animate: { opacity: 1, x: 0 },
	exit: { opacity: 0, x: -25 },
};

const horizontalVariants = {
	initial: { opacity: 0, y: -25 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -25 },
};

function PlayerCard({
	player,
	orientation = "horizontal",
}: {
	player: Player;
	orientation?: "horizontal" | "vertical";
}) {
	const { role, avatarSeed, avatarColor, score } = player;
	const avatarSvg = generateAvatar(avatarSeed, avatarColor);
	return (
		<motion.div
			layout
			variants={
				orientation === "horizontal" ? horizontalVariants : verticalVariants
			}
			initial="initial"
			animate="animate"
			exit="exit"
			transition={{
				type: "spring",
				stiffness: 500,
				damping: 50,
				mass: 1,
			}}
			className="flex items-center rounded-lg border border-input p-0.5 bg-background w-52 relative"
		>
			{role === PlayerRole.HOST && (
				<div className="absolute -top-2 -right-1.5 z-10">
					<CrownIcon className="w-5 h-5 text-yellow-400 rotate-12" />
				</div>
			)}
			<img
				className="rounded-lg border border-input h-10 w-10 relative"
				src={avatarSvg}
			/>
			<div className="flex flex-col justify-center px-4">
				<p className="font-medium text-sm leading-0">{player.name}</p>
				<p className="text-xs text-muted-foreground">{role.toLowerCase()}</p>
			</div>
			<div className="ml-auto px-4">
				<p className="text-xs font-medium">{score}</p>
			</div>
		</motion.div>
	);
}

export function PlayerCards({
	players,
	orientation = "horizontal",
}: {
	players: Player[];
	orientation?: "horizontal" | "vertical";
}) {
	return (
		<ul
			className={`flex gap-1 ${
				orientation === "horizontal" ? "flex-row" : "flex-col"
			}`}
		>
			<AnimatePresence initial={false} mode="popLayout">
				{players
					.sort((a, b) => b.score - a.score)
					.map((player) => (
						<PlayerCard
							key={player.id}
							player={player}
							orientation={orientation}
						/>
					))}
			</AnimatePresence>
		</ul>
	);
}
