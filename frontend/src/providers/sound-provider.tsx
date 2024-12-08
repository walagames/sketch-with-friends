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
	SUCCESS = "success",
	ERROR = "error",
}

type SoundBuffers = {
	[key in SoundEffect]?: AudioBuffer;
};

type SoundContextType = {
	playSound: (sound: SoundEffect) => void;
};

const SoundContext = createContext<SoundContextType | null>(null);

const SOUND_PATHS: Record<SoundEffect, string> = {
	[SoundEffect.CLICK]: "/click-pop.mp3",
	[SoundEffect.SUCCESS]: "/sounds/success.mp3",
	[SoundEffect.ERROR]: "/sounds/error.mp3",
};

export function SoundProvider({ children }: { children: React.ReactNode }) {
	const audioContextRef = useRef<AudioContext>();
	const soundBuffersRef = useRef<SoundBuffers>({});
	const volume = useSelector((state: RootState) => state.preferences.volume);

	useEffect(() => {
		// Initialize AudioContext
		audioContextRef.current = new (window.AudioContext ||
			window.webkitAudioContext)();

		// Load all sound buffers
		Object.entries(SOUND_PATHS).forEach(async ([key, path]) => {
			try {
				const response = await fetch(path);
				const arrayBuffer = await response.arrayBuffer();
				const audioBuffer = await audioContextRef.current!.decodeAudioData(
					arrayBuffer
				);
				soundBuffersRef.current[key as SoundEffect] = audioBuffer;
			} catch (error) {
				console.error(`Failed to load sound: ${path}`, error);
			}
		});

		return () => {
			audioContextRef.current?.close();
		};
	}, []);

	const playSound = (sound: SoundEffect) => {
		if (!audioContextRef.current || !soundBuffersRef.current[sound]) return;

		// Create new buffer source for each play
		const source = audioContextRef.current.createBufferSource();
		source.buffer = soundBuffersRef.current[sound]!;

		// Create gain node for volume control
		const gainNode = audioContextRef.current.createGain();
		gainNode.gain.value = volume;

		// Connect nodes
		source.connect(gainNode);
		gainNode.connect(audioContextRef.current.destination);

		// Play the sound
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
