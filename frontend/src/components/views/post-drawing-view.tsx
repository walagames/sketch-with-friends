import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { SkyScene } from "@/components/scenes/sky-scene";
import { Player } from "@/state/features/room";
import { generateAvatar } from "@/lib/avatar";
import { ArrowDownIcon, ArrowUpIcon, CrownIcon, FlameIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatePresence, motion } from "framer-motion";
import { RainCloudDoodle } from "@/components/doodle/rain-cloud-doodle";
import { getDrawingPlayer } from "@/lib/player";
const springConfig = {
	type: "spring",
	stiffness: 100,
	damping: 14,
};

function getPlaceChange(
	players: Player[],
	pointsAwarded: Record<string, number>
): Record<string, number> {
	// Sort players by current score (after points awarded)
	const currentRanking = [...players].sort((a, b) => b.score - a.score);

	// Calculate previous scores by subtracting awarded points
	const previousScores = players.map((player) => ({
		...player,
		score: player.score - (pointsAwarded[player.id] ?? 0),
	}));

	// Sort by previous scores
	const previousRanking = [...previousScores].sort((a, b) => b.score - a.score);

	// Calculate position changes
	const changes: Record<string, number> = {};

	currentRanking.forEach((player, currentPos) => {
		const previousPos = previousRanking.findIndex((p) => p.id === player.id);
		// Positive means moved up, negative means moved down
		changes[player.id] = previousPos - currentPos;
	});

	return changes;
}

export function PostDrawingView() {
	const word = useSelector((state: RootState) => state.game.selectedWord);

	const players = useSelector((state: RootState) => state.room.players);
	const sortedPlayers = Object.values(players).sort(
		(a, b) => b.score - a.score
	);

	const pointsAwarded = useSelector(
		(state: RootState) => state.game.pointsAwarded
	);

	const placeChanges = getPlaceChange(sortedPlayers, pointsAwarded);

	const drawingPlayer = getDrawingPlayer(players);

	const message = drawingPlayer
		? `${drawingPlayer.username} sketched: `
		: "The word was: ";

	return (
		<SkyScene className="px-4 lg:px-0">
			<h1 className="text-xl lg:text-2xl lg:py-2">
				{message}
				<span className="lg:text-3xl text-xl font-bold">{word?.value}</span>
			</h1>
			<Podium players={sortedPlayers.slice(0, 3)} placeChanges={placeChanges} />
			{sortedPlayers.length > 3 && (
				<Leaderboard
					players={sortedPlayers.slice(3)}
					placeChanges={placeChanges}
				/>
			)}
			<AnimatePresence>
				<RainCloudDoodle
					key="rain-cloud-1"
					className="absolute hidden md:block h-32"
					duration={5}
					style={{ top: "8%", left: "20%" }}
					src="/doodles/rain-cloud.png"
				/>
				<RainCloudDoodle
					key="rain-cloud-2"
					className="absolute hidden md:block h-32"
					duration={4.5}
					style={{ top: "10%", right: "10%" }}
					src="/doodles/rain-cloud.png"
				/>
			</AnimatePresence>
		</SkyScene>
	);
}

function Podium({
	players,
	placeChanges,
}: {
	players: Player[];
	placeChanges: Record<string, number>;
}) {
	const firstPlace = players[0];
	const secondPlace = players[1];
	const thirdPlace = players[2];

	return (
		<div className="grid grid-cols-3 lg:gap-10 gap-4 items-end max-w-xl w-full">
			<PodiumPlace
				placeChanges={placeChanges[secondPlace?.id || ""]}
				player={secondPlace}
				place={2}
			/>
			<PodiumPlace
				placeChanges={placeChanges[firstPlace?.id || ""]}
				player={firstPlace}
				place={1}
			/>
			<PodiumPlace
				placeChanges={placeChanges[thirdPlace?.id || ""]}
				player={thirdPlace}
				place={3}
			/>
		</div>
	);
}

function Leaderboard({
	players,
	placeChanges,
}: {
	players: Player[];
	placeChanges: Record<string, number>;
}) {
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
				<LeaderboardPlace
					key={player.id}
					player={player}
					index={index}
					placeChanges={placeChanges[player.id]}
				/>
			))}
		</div>
	);
}

function LeaderboardPlace({
	player,
	index,
	placeChanges,
}: {
	player: Player;
	index: number;
	placeChanges: number;
}) {
	const { score, username, avatarConfig } = player;
	const avatarSvg = generateAvatar(avatarConfig);

	const points =
		useSelector((state: RootState) => state.game.pointsAwarded[player.id]) ?? 0;

	const currentPlayerId = useSelector(
		(state: RootState) => state.room.playerId
	);
	const isCurrentPlayer = currentPlayerId === player.id;

	return (
		<div className="flex lg:gap-6 gap-2 w-full items-center">
			<p className="text-lg font-bold text-foreground flex items-center gap-1.5">
				{index + 4}th
				<PlaceChange placeChanges={placeChanges} />
			</p>
			<img
				className="rounded-lg aspect-square relative border-2 w-10"
				src={avatarSvg}
			/>
			<p className="text-xl font-bold text-foreground truncate">
				{username}{" "}
				{isCurrentPlayer && (
					<span className="text-xs text-foreground/50 px-0.5">(You)</span>
				)}
			</p>
			<div className="relative text-lg font-medium text-foreground ml-auto">
				{points > 0 && (
					<div className="absolute lg:text-base gap-1 text-sm flex -top-1 lg:-top-1.5 right-20 lg:right-24 bg-white border border-zinc-300 rounded-lg shadow-sm lg:px-3 px-2 lg:py-1.5 py-1">
						<span className="flex items-center">+{points}</span>
						{player.streak > 0 && (
							<span className="flex items-center font-bold">
								<FlameIcon className="w-4 h-4 -translate-y-[1px] text-red-500" />{" "}
								{player.streak}
							</span>
						)}
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
	placeChanges,
}: {
	player: Player | undefined;
	place: number;
	placeChanges: number;
}) {
	const points =
		useSelector(
			(state: RootState) => state.game.pointsAwarded[player?.id || ""]
		) ?? 0;
	const currentPlayerId = useSelector(
		(state: RootState) => state.room.playerId
	);

	if (!player) return null;

	const { score, username, avatarConfig, id } = player;
	const isCurrentPlayer = currentPlayerId === id;
	const avatarSvg = generateAvatar(avatarConfig);

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
				className=" lg:text-xl font-bold text-foreground lg:max-w-40 max-w-32 flex items-center"
			>
				<span className="truncate">{username}</span>
				<span className="text-sm text-foreground/50 px-1">
					{isCurrentPlayer && "(You)"}
				</span>
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
				{points > 0 && (
					<AwardedPointsCard points={points} streak={player.streak} />
				)}
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
				className="text-lg lg:text-2xl font-bold text-foreground py-2 flex items-center gap-1.5"
			>
				{placeText}
				<PlaceChange placeChanges={placeChanges} />
			</motion.p>
		</div>
	);
}

function PlaceChange({ placeChanges }: { placeChanges: number }) {
	if (placeChanges === 0) return null;

	return (
		<p className="text-lg font-bold text-foreground flex items-center">
			{placeChanges > 0 ? (
				<ArrowUpIcon className="size-4 text-green-500" />
			) : (
				<ArrowDownIcon className="size-4 text-red-500" />
			)}
			{Math.abs(placeChanges)}
		</p>
	);
}

function AwardedPointsCard({
	points,
	streak,
}: {
	points: number;
	streak: number;
}) {
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
			<p className="text-md flex items-center gap-1.5">
				+{points}
				{streak > 0 && (
					<span className="flex items-center font-bold">
						<FlameIcon className="w-4 h-4 -translate-y-[1px] text-red-500" />{" "}
						{streak}
					</span>
				)}
			</p>
		</motion.div>
	);
}
