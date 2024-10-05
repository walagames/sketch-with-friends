import Canvas from "@/components/canvas/canvas";
import { useRoomContext } from "../../../contexts/room-context";
import { CanvasTools } from "@/components/canvas/canvas-tools";
import { GuessForm } from "@/components/room/guess-form";
import { GameRole } from "@/types/game";
import { getGameRole, getPickingPlayer } from "@/lib/player";
import { motion } from "framer-motion";
import { Player } from "@/types/player";
import { Button } from "@/components/ui/button";
import { RoomEventType } from "@/types/room";
import CountdownTimer from "@/components/room/countdown-timer";
import { generateAvatar } from "@/lib/avatar";
const playingView = {
	[GameRole.PICKING]: { Component: PickingWordView },
	[GameRole.DRAWING]: { Component: DrawingView },
	[GameRole.GUESSING]: { Component: GuessingView },
};

export function PlayingView() {
	const { room, playerId } = useRoomContext();

	const role = getGameRole(playerId, room.players);
	const View = playingView[role as keyof typeof playingView];

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.98 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{
				type: "spring",
				stiffness: 500,
				damping: 50,
				mass: 1,
			}}
			className="h-full w-full flex flex-col items-center justify-center relative"
		>
			<View.Component />
		</motion.div>
	);
}

function PlayingHeader({ role }: { role: GameRole }) {
	const { room, selectedWord } = useRoomContext();

	const isDrawing = role === GameRole.DRAWING;

	return (
		<div className="flex justify-between w-full items-center">
			<div className="flex items-center justify-center text-2xl gap-1.5">
				Round <span className="font-medium">{room.game.currentRound}</span> of{" "}
				<span className="font-medium">{room.game.totalRounds}</span>
			</div>

			<div className="text-2xl mx-auto">
				{isDrawing ? (
					selectedWord
				) : (
					<WordWithLetterBlanks word={room.game.word} />
				)}
			</div>
			<CountdownTimer
				endTime={new Date(room.game.currentPhaseDeadline).getTime()}
			/>
		</div>
	);
}

function WordWithLetterBlanks({ word }: { word: string }) {
	const wordLetters = word.replaceAll("*", "_").split("");
	return (
		<div className="text-2xl mx-auto">
			{wordLetters.map((letter, index) => (
				<span key={index}>{letter}</span>
			))}
		</div>
	);
}

export function DrawingView() {
	return (
		<div className="flex flex-col  items-start justify-center gap-2">
			<PlayingHeader role={GameRole.DRAWING} />
			<div className="flex w-full h-full items-start justify-center gap-2">
				{/* <div className="h-full bg-white p-1 rounded-lg border border-input">
					<PlayerCards orientation="vertical" players={room.players} />
				</div> */}
				<div className="flex flex-col items-center justify-center gap-2 w-[800px]">
					<Canvas width={800} height={600} />
					<CanvasTools />
				</div>
			</div>
		</div>
	);
}

export function GuessingView() {
	const { room } = useRoomContext();

	const pickingPlayer = getPickingPlayer(room.players);

	return pickingPlayer ? (
		<PlayerIsPickingView player={pickingPlayer} />
	) : (
		<div className="flex flex-col  items-start justify-center gap-2">
			<PlayingHeader role={GameRole.GUESSING} />
			<div className="flex w-full h-full items-start justify-center gap-2">
				{/* <div className="h-full bg-white p-1 rounded-lg border border-input">
					<PlayerCards orientation="vertical" players={room.players} />
				</div> */}
				<div className="flex flex-col items-center justify-center gap-2 w-[800px]">
					<Canvas width={800} height={600} />
					<div className="flex items-center justify-center p-6  w-full">
						<GuessForm />
					</div>
				</div>
			</div>
		</div>
	);
}

function PickingWordView() {
	const { wordOptions, handleEvent, setSelectedWord } = useRoomContext();

	const handleSelectWord = (word: string) => {
		handleEvent({
			type: RoomEventType.PICK_WORD,
			payload: word,
		});
		setSelectedWord(word);
	};

	return (
		<div className="flex flex-col items-center justify-center gap-2">
			<h1 className="text-2xl font-medium">Pick a word</h1>
			<div className="flex items-center justify-center gap-2">
				{wordOptions.map((word) => (
					<Button key={word} onClick={() => handleSelectWord(word)}>
						{word}
					</Button>
				))}
			</div>
		</div>
	);
}

function PlayerIsPickingView({ player }: { player: Player }) {
	const avatarSvg = generateAvatar(player.avatarSeed, player.avatarColor);
	return (
		<div className="flex flex-col items-center justify-center gap-2">
			<img src={avatarSvg} className="w-20 h-20 rounded-full" />
			<h1 className="text-2xl font-medium">{player.name} is picking a word</h1>
		</div>
	);
}
