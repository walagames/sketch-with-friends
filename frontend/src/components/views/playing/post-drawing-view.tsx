import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { SkyScene } from "@/components/scenes/sky-scene";
import { Player } from "@/state/features/room";
import { generateAvatar } from "@/lib/avatar";
import { CrownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatePresence, motion } from "framer-motion";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";

const springConfig = {
	type: "spring",
	stiffness: 100,
	damping: 14,
};
export function PostDrawingView() {
	const word = useSelector((state: RootState) => state.game.selectedWord);

	const players = useSelector((state: RootState) => state.room.players);
	const sortedPlayers = Object.values(players).sort(
		(a, b) => b.score - a.score
	);

	const isLastPhase = useSelector((state: RootState) => state.game.isLastPhase);

	return (
		<SkyScene className="px-4 lg:px-0">
			<h1 className="text-xl lg:text-2xl lg:py-2">
				The word was:{" "}
				<span className="lg:text-3xl text-xl font-bold">{word}</span>
			</h1>
			<Podium players={sortedPlayers.slice(0, 3)} />
			{sortedPlayers.length > 3 && (
				<Leaderboard players={sortedPlayers.slice(3)} />
			)}
			<AnimatePresence>
				<BobbingDoodle
					key="rain-cloud-1"
					className="absolute hidden md:block h-32"
					duration={5}
					style={{ top: "8%", left: "20%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					key="rain-cloud-2"
					className="absolute hidden md:block h-32"
					duration={4.5}
					style={{ top: "10%", right: "10%" }}
					src="/doodles/rain-cloud.png"
				/>
			</AnimatePresence>
			<AirplaneDoodle
				skipTransition
				startAt={{ left: "5%", top: "55%", rotate: 20, opacity: 0 }}
				animateTo={{ left: "5%", top: "55%", rotate: 20, opacity: 1 }}
				leaveTo={
					isLastPhase
						? { left: "80%", top: "-20%", rotate: -5 }
						: { left: "145%", top: "65%", rotate: 30 }
				}
			/>
		</SkyScene>
	);
}

function Podium({ players }: { players: Player[] }) {
	const firstPlace = players[0];
	const secondPlace = players[1];
	const thirdPlace = players[2];

	return (
		<div className="grid grid-cols-3 lg:gap-10 gap-4 items-end max-w-xl w-full">
			<PodiumPlace player={secondPlace} place={2} />
			<PodiumPlace player={firstPlace} place={1} />
			<PodiumPlace player={thirdPlace} place={3} />
		</div>
	);
}

function Leaderboard({ players }: { players: Player[] }) {
	return (
		<div
			className={cn(
				"relative z-50 flex flex-col items-center justify-start overflow-x-hidden overflow-y-auto",
				"w-full max-w-2xl max-h-80 h-[var(--max-leaderboard-height)] gap-3",
				"lg:px-10 p-4 lg:py-6 ",
				"bg-zinc-400/10 border-4 border-border border-dashed rounded-lg scrollbar-hide"
			)}
		>
			{players.map((player, index) => (
				<LeaderboardPlace key={player.id} player={player} index={index} />
			))}
		</div>
	);
}

function LeaderboardPlace({
	player,
	index,
}: {
	player: Player;
	index: number;
}) {
	const { score, profile: { name, avatarSeed } } = player;
	const avatarSvg = generateAvatar(avatarSeed);

	const points =
		useSelector((state: RootState) => state.game.pointsAwarded[player.id]) ?? 0;

	return (
		<div className="flex lg:gap-6 gap-2 w-full items-center">
			<p className="text-lg font-bold text-foreground">{index + 4}th</p>
			<img
				className="rounded-lg aspect-square relative border-2 w-10"
				src={avatarSvg}
			/>
			<p className="text-xl font-bold text-foreground truncate">{name}</p>
			<div className="relative text-lg font-medium text-foreground ml-auto">
				{points > 0 && (
					<div className="absolute lg:text-base text-sm flex -top-1 lg:-top-1.5 right-20 lg:right-24 bg-white border border-zinc-300 rounded-lg shadow-sm lg:px-3 px-2 lg:py-1.5 py-1">
						+{points}
					</div>
				)}
				<AnimatedNumber value={score} previous={score - points} /> pts
			</div>
		</div>
	);
}

function PodiumPlace({
	player,
	place,
}: {
	player: Player | undefined;
	place: number;
}) {
	const points =
		useSelector(
			(state: RootState) => state.game.pointsAwarded[player?.id || ""]
		) ?? 0;

	if (!player) return null;

	const { score, profile: { name, avatarSeed } } = player;
	const avatarSvg = generateAvatar(avatarSeed);

	const podiumColor = {
		1: { color: "bg-primary", height: 180, placeText: "1st", delay: 0.4 },
		2: { color: "bg-sky-500", height: 140, placeText: "2nd", delay: 0.3 },
		3: { color: "bg-red-500", height: 120, placeText: "3rd", delay: 0.2 },
	};

	const { color, height, placeText, delay } =
		podiumColor[place as keyof typeof podiumColor];

	return (
		<div
			className={cn(
				"flex flex-col gap-2 items-center justify-end",
				place === 1 && "col-start-2"
			)}
			style={{
				height: 380,
			}}
		>
			<motion.div
				layout
				className="relative"
				initial={{
					opacity: 0,
				}}
				animate={{
					opacity: 1,
				}}
				transition={{
					delay: delay + 0.2,
					...springConfig,
				}}
			>
				{place === 1 && (
					<CrownIcon className="w-14 h-14 text-yellow-400 absolute -top-9 -left-6 -rotate-[22deg] z-10" />
				)}
				<img
					className="rounded-lg aspect-square relative border-4 w-20"
					src={avatarSvg}
				/>
			</motion.div>
			<motion.p
				layout
				className="text-lg lg:text-xl font-bold text-foreground truncate max-w-full"
			>
				{name}
			</motion.p>
			<motion.div
				className={cn(
					"flex flex-col items-center p-4 rounded-lg w-full shadow-accent",
					color
				)}
				initial={{ opacity: 0, height: 0 }}
				layout
				animate={{ opacity: 1, height }}
				transition={{ delay: delay, ...springConfig }}
			>
				<p className="font-medium text-background text-lg lg:text-xl">
					<AnimatedNumber delay={450} previous={score - points} value={score} />{" "}
					pts
				</p>
				{points > 0 && <AwardedPointsCard points={points} />}
			</motion.div>
			<motion.p
				initial={{
					opacity: 0,
				}}
				animate={{
					opacity: 1,
				}}
				transition={{
					delay: delay,
					...springConfig,
				}}
				className="text-lg lg:text-2xl font-bold text-foreground py-2"
			>
				{placeText}
			</motion.p>
		</div>
	);
}

function AwardedPointsCard({ points }: { points: number }) {
	return (
		<motion.div
			className="relative mt-2.5 bg-white border border-zinc-300 rounded-lg px-3 py-1.5 shadow-lg"
			initial={{ opacity: 0, y: -6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.7, duration: 0.2, ease: "easeInOut" }}
		>
			<div
				className={cn(
					"absolute top-[-10px] left-1/2 transform -translate-x-1/2",
					"w-0 h-0",
					"border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white"
				)}
			/>
			<p className="text-md">+ {points}</p>
		</motion.div>
	);
}
