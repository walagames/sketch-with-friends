import { useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { Timer } from "@/components/ui/timer";
import { HillScene } from "@/components/scenes/hill-scene";
import { Player } from "@/state/features/room";
import { generateAvatar } from "@/lib/avatar";
import { CrownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/animated-number";
// import { RaisedButton } from "@/components/raised-button";
export function PostDrawingView() {
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);

	const word = useSelector((state: RootState) => state.game.selectedWord);

	const players = useSelector((state: RootState) => state.room.players);
	const sortedPlayers = Object.values(players).sort(
		(a, b) => b.score - a.score
	);

	// const isLastPhase = useSelector((state: RootState) => state.game.isLastPhase);

	// const dispatch = useDispatch();

	return (
		<HillScene className="">
			<div className="absolute top-10 right-10">
				<Timer endTime={deadline} />
			</div>
			<h1 className="text-2xl py-8">
				The word was: <span className="text-3xl font-bold">{word}</span>
			</h1>
			<Podium players={sortedPlayers.slice(0, 3)} />
			{sortedPlayers.length > 3 && (
				<Leaderboard players={sortedPlayers.slice(3)} />
			)}
			{/* {isLastPhase && (
				<div className="absolute bottom-8 right-8 z-50">
					<RaisedButton
						onClick={() => {
							dispatch({
								type: "room/changeStage",
								payload: RoomStage.PreGame,
								fromServer: true,
							});
						}}
						variant="action"
						size="xl"
					>
						Return to room
					</RaisedButton>
				</div>
			)} */}
		</HillScene>
	);
}

function Podium({ players }: { players: Player[] }) {
	const firstPlace = players[0];
	const secondPlace = players[1];
	const thirdPlace = players[2];

	return (
		<div className="grid grid-cols-3 gap-10 items-end max-w-lg w-full">
			<PodiumPlace player={secondPlace} place={2} />
			<PodiumPlace player={firstPlace} place={1} />
			<PodiumPlace player={thirdPlace} place={3} />
		</div>
	);
}

function Leaderboard({ players }: { players: Player[] }) {
	return (
		<div className="w-full max-w-xl overflow-x-hidden scrollbar-hide max-h-60 bg-zinc-400/10 border-4 border-border border-dashed rounded-lg flex flex-col items-center justify-start px-10 py-6 gap-3 overflow-y-auto">
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

	return (
		<div className="flex gap-6 w-full items-center">
			<p className="text-lg font-bold text-foreground">{index + 4}th</p>
			<img
				className="rounded-lg aspect-square relative border-2 w-10"
				src={avatarSvg}
			/>
			<p className="text-xl font-bold text-foreground">{name}</p>
			<p className="text-lg font-medium text-foreground ml-auto">{score} pts</p>
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
		1: { color: "bg-primary", height: "h-36", placeText: "1st" },
		2: { color: "bg-sky-500", height: "h-28", placeText: "2nd" },
		3: { color: "bg-red-500", height: "h-20", placeText: "3rd" },
	};

	const { color, height, placeText } =
		podiumColor[place as keyof typeof podiumColor];

	return (
		<div
			className={cn(
				"flex flex-col gap-2 items-center",
				place === 1 && "col-start-2"
			)}
		>
			<div className="relative">
				{place === 1 && (
					<CrownIcon className="w-14 h-14 text-yellow-400 absolute -top-9 -left-6 -rotate-[22deg] z-10" />
				)}
				<img
					className="rounded-lg aspect-square relative border-4 w-20"
					src={avatarSvg}
				/>
			</div>
			<p className="text-xl font-bold text-foreground">{name}</p>
			<div
				className={cn(
					"flex flex-col items-center p-4 rounded-lg w-full shadow-accent",
					color,
					height
				)}
			>
				<p className="font-medium text-background text-lg">
					<AnimatedNumber delay={450} previous={score - points} value={score} />{" "}
					pts
				</p>
			</div>
			<p className="text-2xl font-bold text-foreground py-2">{placeText}</p>
		</div>
	);
}
