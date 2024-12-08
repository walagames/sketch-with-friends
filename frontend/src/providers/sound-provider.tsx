import { GamePhase, Guess } from "@/state/features/game";
import { Player } from "@/state/features/room";
import { RootState } from "@/state/store";
import { createContext, useContext, useEffect, useRef } from "react";
import { useSelector } from "react-redux";

declare global {
	interface Window {
		webkitAudioContext: typeof AudioContext;
	}
}

export enum SoundEffect {
	CLICK = "click",
	CORRECT = "correct",
	CLOCK_TICK = "clock-tick",
	PLAYER_JOIN = "player-join",
	PLAYER_LEAVE = "player-leave",
	ROUND_END = "round-end",
	SCENE_CHANGE = "scene-change",
	PLAYER_WIN = "player-win",
	PLAYER_LOSE = "player-lose",
}

type SoundBuffers = {
	[key in SoundEffect]?: AudioBuffer;
};

type SoundContextType = {
	playSound: (sound: SoundEffect) => void;
};

const SoundContext = createContext<SoundContextType | null>(null);

// Create a type for sound configuration
type SoundConfig = {
	path: string;
	volume: number;
};

const SOUND_PATHS: Record<SoundEffect, SoundConfig> = {
	[SoundEffect.CLICK]: { path: "/sounds/click-pop.mp3", volume: 0.6 },
	[SoundEffect.CORRECT]: { path: "/sounds/correct.mp3", volume: 1 },
	[SoundEffect.CLOCK_TICK]: { path: "/sounds/clock-tick.mp3", volume: 1 },
	[SoundEffect.PLAYER_JOIN]: { path: "/sounds/player-join.mp3", volume: 1 },
	[SoundEffect.PLAYER_LEAVE]: { path: "/sounds/player-leave.mp3", volume: 1 },
	[SoundEffect.ROUND_END]: { path: "/sounds/round-end.mp3", volume: 1 },
	[SoundEffect.SCENE_CHANGE]: { path: "/sounds/whoosh.mp3", volume: 0.25 },
	[SoundEffect.PLAYER_WIN]: { path: "/sounds/player-win.mp3", volume: 1 },
	[SoundEffect.PLAYER_LOSE]: { path: "/sounds/player-lose.mp3", volume: 1 },
};

export function SoundProvider({ children }: { children: React.ReactNode }) {
	const audioContextRef = useRef<AudioContext>();
	const soundBuffersRef = useRef<SoundBuffers>({});
	const volume = useSelector((state: RootState) => state.preferences.volume);
	const guesses = useSelector((state: RootState) => state.game.guesses);
	const prevGuessesRef = useRef<Guess[]>([]);
	const phase = useSelector((state: RootState) => state.game.phase);
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	const timeoutRef = useRef<NodeJS.Timeout>();
	const intervalRef = useRef<NodeJS.Timeout>();
	const players = useSelector((state: RootState) => state.room.players);
	const prevPlayersRef = useRef<{ [key: string]: Player }>({});
	const isInitializedRef = useRef(false);
	const gamePhase = useSelector((state: RootState) => state.game.phase);
	const prevPhaseRef = useRef(gamePhase);
	const roomStage = useSelector((state: RootState) => state.room.stage);
	const prevRoomStageRef = useRef(roomStage);

	useEffect(() => {
		// Initialize AudioContext
		audioContextRef.current = new (window.AudioContext ||
			window.webkitAudioContext)();

		// Load all sound buffers
		Object.entries(SOUND_PATHS).forEach(async ([key, config]) => {
			try {
				const response = await fetch(config.path);
				const arrayBuffer = await response.arrayBuffer();
				const audioBuffer = await audioContextRef.current!.decodeAudioData(
					arrayBuffer
				);
				soundBuffersRef.current[key as SoundEffect] = audioBuffer;
			} catch (error) {
				console.error(`Failed to load sound: ${config.path}`, error);
			}
		});

		return () => {
			audioContextRef.current?.close();
		};
	}, []);

	// Listen for game state changes and play appropriate sounds
	useEffect(() => {
		const newCorrectGuess = guesses.some(
			(guess) =>
				guess.isCorrect &&
				!prevGuessesRef.current.find((prev) => prev.id === guess.id)
		);

		if (newCorrectGuess) {
			playSound(SoundEffect.CORRECT);
		}

		prevGuessesRef.current = guesses;
	}, [guesses]);

	// Play clock tick sounds when drawing phase is ending
	useEffect(() => {
		// Clear existing timers when phase changes or component unmounts
		const cleanup = () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			if (intervalRef.current) clearInterval(intervalRef.current);
		};

		if (phase === GamePhase.Drawing && deadline) {
			const now = Date.now();
			const timeUntilDeadline = new Date(deadline).getTime() - now;
			const timeUntilWarning = timeUntilDeadline - 5000; // 5 seconds before deadline

			// Only set timers if deadline is in the future and we haven't passed the warning point
			if (timeUntilDeadline > 0 && timeUntilWarning > 0) {
				// Set timeout for when to start the countdown
				timeoutRef.current = setTimeout(() => {
					playSound(SoundEffect.CLOCK_TICK);
					// Start interval for remaining ticks
					intervalRef.current = setInterval(() => {
						playSound(SoundEffect.CLOCK_TICK);
					}, 1000);
				}, timeUntilWarning);
			}
		}

		return cleanup;
	}, [phase, deadline]);

	// Play player join/leave sounds when players change
	useEffect(() => {
		// Skip if this is the first render or players object is empty
		if (!isInitializedRef.current) {
			if (Object.keys(players).length > 0) {
				isInitializedRef.current = true;
				prevPlayersRef.current = players;
			}
			return;
		}

		const currentIds = Object.keys(players);
		const prevIds = Object.keys(prevPlayersRef.current);

		// Check for new players (joins)
		const newPlayers = currentIds.filter((id) => !prevIds.includes(id));
		if (newPlayers.length > 0) {
			playSound(SoundEffect.PLAYER_JOIN);
		}

		// Check for removed players (leaves)
		const removedPlayers = prevIds.filter((id) => !currentIds.includes(id));
		if (removedPlayers.length > 0) {
			playSound(SoundEffect.PLAYER_LEAVE);
		}

		prevPlayersRef.current = players;
	}, [players]);

	// Play scene change sound when phase or room stage changes
	useEffect(() => {
		if (
			prevPhaseRef.current !== gamePhase ||
			prevRoomStageRef.current !== roomStage
		) {
			// Always play scene change sound immediately
			playSound(SoundEffect.SCENE_CHANGE);
		}

		prevPhaseRef.current = gamePhase;
		prevRoomStageRef.current = roomStage;
	}, [gamePhase, roomStage]);

	const playSound = (sound: SoundEffect) => {
		if (!audioContextRef.current || !soundBuffersRef.current[sound]) return;

		const source = audioContextRef.current.createBufferSource();
		source.buffer = soundBuffersRef.current[sound]!;

		const gainNode = audioContextRef.current.createGain();
		// Multiply the user's volume preference with the sound's default volume
		gainNode.gain.value = volume * SOUND_PATHS[sound].volume;

		source.connect(gainNode);
		gainNode.connect(audioContextRef.current.destination);

		source.start(0);
	};

	return (
		<SoundContext.Provider value={{ playSound }}>
			{children}
		</SoundContext.Provider>
	);
}

export function useSound() {
	const context = useContext(SoundContext);
	if (!context) {
		throw new Error("useSound must be used within a SoundProvider");
	}
	return context.playSound;
}