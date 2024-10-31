import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { Timer } from "@/components/ui/timer";
import { HillScene } from "@/components/scenes/hill-scene";
import { Player } from "@/state/features/room";
import { generateAvatar } from "@/lib/avatar";
import { CrownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { motion } from "framer-motion";

const springConfig = {
	type: "spring",
	stiffness: 100,
	damping: 14,
};
export function PostDrawingView() {
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);

	const word = useSelector((state: RootState) => state.game.selectedWord);

	const players = useSelector((state: RootState) => state.room.players);
	const sortedPlayers = Object.values(players).sort(
		(a, b) => b.score - a.score
	);

	return (
		<HillScene className="">
			<div className="absolute top-10 right-10">
				<Timer endTime={deadline} />
			</div>
			<h1 className="text-2xl py-2">
				The word was: <span className="text-3xl font-bold">{word}</span>
			</h1>
			<Podium players={sortedPlayers.slice(0, 3)} />
			{sortedPlayers.length > 3 && (
				<Leaderboard players={sortedPlayers.slice(3)} />
			)}
		</HillScene>
	);
}

function Podium({ players }: { players: Player[] }) {
	const firstPlace = players[0];
	const secondPlace = players[1];
	const thirdPlace = players[2];

	return (
		<div className="grid grid-cols-3 gap-10 items-end max-w-xl w-full">
			<PodiumPlace player={secondPlace} place={2} />
			<PodiumPlace player={firstPlace} place={1} />
			<PodiumPlace player={thirdPlace} place={3} />
		</div>
	);
}

function Leaderboard({ players }: { players: Player[] }) {
	return (
		<div className="w-full max-w-xl overflow-x-hidden scrollbar-hide max-h-56 bg-zinc-400/10 border-4 border-border border-dashed rounded-lg flex flex-col items-center justify-start px-10 py-6 gap-3 overflow-y-auto">
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
	const { name, score, avatarSeed } = player;
	const avatarSvg = generateAvatar(avatarSeed);

	const points =
		useSelector((state: RootState) => state.game.pointsAwarded[player.id]) ?? 0;

	return (
		<div className="flex gap-6 w-full items-center">
			<p className="text-lg font-bold text-foreground">{index + 4}th</p>
			<img
				className="rounded-lg aspect-square relative border-2 w-10"
				src={avatarSvg}
			/>
			<p className="text-xl font-bold text-foreground">{name}</p>
			<div className="relative text-lg font-medium text-foreground ml-auto">
				{points > 0 && (
					<p className="absolute -top-1.5 right-24 bg-white rounded-lg px-3 py-1.5">
						+{points}
					</p>
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

	const { name, score, avatarSeed } = player;
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
			<motion.p layout className="text-xl font-bold text-foreground">
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
				<p className="font-medium text-background text-xl">
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
				className="text-2xl font-bold text-foreground py-2"
			>
				{placeText}
			</motion.p>
		</div>
	);
}

function AwardedPointsCard({ points }: { points: number }) {
	return (
		<motion.div
			className="relative mt-2.5 bg-white border border-gray-300 rounded-lg px-3 py-1.5 shadow-lg"
			initial={{ opacity: 0, y: -6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.7, duration: 0.2, ease: "easeInOut" }}
		>
			<div className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white" />
			<p className="text-md">+ {points}</p>
		</motion.div>
	);
}
