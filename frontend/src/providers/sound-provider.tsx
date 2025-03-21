import { ChatMessageType, Player, RoomState } from "@/state/features/room";
import { RootState } from "@/state/store";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useMemo,
} from "react";
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
	SCRIBBLE = "scribble",
	CHAT_MESSAGE = "chat-message",
}

type SoundBuffers = {
	[key in SoundEffect]?: AudioBuffer;
};

type SoundContextType = {
	playSound: (sound: SoundEffect) => void;
};

const SoundContext = createContext<SoundContextType | null>(null);

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
	[SoundEffect.SCENE_CHANGE]: { path: "/sounds/whoosh.mp3", volume: 0.2 },
	[SoundEffect.PLAYER_WIN]: { path: "/sounds/player-win.mp3", volume: 1 },
	[SoundEffect.PLAYER_LOSE]: { path: "/sounds/player-lose.mp3", volume: 1 },
	[SoundEffect.SCRIBBLE]: { path: "/sounds/scribble.mp3", volume: 0.4 },
	[SoundEffect.CHAT_MESSAGE]: {
		path: "/sounds/chat-pop.mp3",
		volume: 0.6,
	},
};

export function SoundProvider({ children }: { children: React.ReactNode }) {
	const audioContextRef = useRef<AudioContext>();
	const soundBuffersRef = useRef<SoundBuffers>({});
	const lastSoundTimeRef = useRef<{ [key in SoundEffect]?: number }>({});
	const volume = useSelector((state: RootState) => state.client.volume);
	const chatMessages = useSelector(
		(state: RootState) => state.room.chatMessages
	);
	const lastMessageIdRef = useRef<string | null>(null);
	const currentState = useSelector(
		(state: RootState) => state.room.currentState
	);
	const timerEndsAt = useSelector((state: RootState) => state.room.timerEndsAt);
	const timeoutRef = useRef<NodeJS.Timeout>();
	const intervalRef = useRef<NodeJS.Timeout>();
	const players = useSelector((state: RootState) => state.room.players);
	const prevPlayersRef = useRef<{ [key: string]: Player }>({});
	const isInitializedRef = useRef(false);
	const prevPhaseRef = useRef(currentState);

	const playSound = useCallback(
		(sound: SoundEffect) => {
			if (!audioContextRef.current || !soundBuffersRef.current[sound]) return;

			// Prevent playing the same sound within 100ms
			const now = Date.now();
			const lastPlayTime = lastSoundTimeRef.current[sound] || 0;
			if (now - lastPlayTime < 100) return;
			lastSoundTimeRef.current[sound] = now;

			if (audioContextRef.current.state === "suspended") {
				audioContextRef.current.resume();
			}

			const source = audioContextRef.current.createBufferSource();
			source.buffer = soundBuffersRef.current[sound]!;

			const gainNode = audioContextRef.current.createGain();
			gainNode.gain.value = volume * SOUND_PATHS[sound].volume;

			source.connect(gainNode);
			gainNode.connect(audioContextRef.current.destination);

			source.start(0);
		},
		[volume]
	);

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
		const latestMessage = chatMessages[chatMessages.length - 1];

		if (latestMessage && latestMessage.id !== lastMessageIdRef.current) {
			if (latestMessage.type === ChatMessageType.Correct) {
				playSound(SoundEffect.CORRECT);
			} else {
				playSound(SoundEffect.CHAT_MESSAGE);
			}
			lastMessageIdRef.current = latestMessage.id;
		}
	}, [chatMessages, playSound]);

	// Play clock tick sounds when drawing phase is ending
	useEffect(() => {
		// Clear existing timers when phase changes or component unmounts
		const cleanup = () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			if (intervalRef.current) clearInterval(intervalRef.current);
		};

		if (currentState === RoomState.Drawing && timerEndsAt) {
			const now = Date.now();
			const timeUntilDeadline = new Date(timerEndsAt).getTime() - now;
			const timeUntilWarning = timeUntilDeadline - 9000; // 9 seconds before deadline

			// Only set timers if deadline is in the future and we haven't passed the warning point
			if (timeUntilDeadline > 0) {
				// Calculate the delay to the next even second
				const millisecondsToNextEven = (timeUntilWarning * -1) % 1000;

				let delay = millisecondsToNextEven;
				if (timeUntilWarning > 0) {
					delay = timeUntilWarning;
				}

				// Set timeout for when to start the countdown
				timeoutRef.current = setTimeout(() => {
					playSound(SoundEffect.CLOCK_TICK);
					// Start interval for remaining ticks
					intervalRef.current = setInterval(() => {
						if (new Date(timerEndsAt).getTime() - Date.now() <= 0) {
							clearInterval(intervalRef.current);
							return;
						}
						playSound(SoundEffect.CLOCK_TICK);
					}, 1000);
				}, delay);
			}
		}

		return cleanup;
	}, [currentState, timerEndsAt, playSound]);

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
	}, [players, playSound]);

	// Play scene change sound when phase changes
	useEffect(() => {
		if (prevPhaseRef.current !== currentState) {
			playSound(SoundEffect.SCENE_CHANGE);
		}

		prevPhaseRef.current = currentState;
	}, [currentState, playSound]);

	const contextValue = useMemo(() => ({ playSound }), [playSound]);

	return (
		<SoundContext.Provider value={contextValue}>
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
