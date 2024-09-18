import { Stroke } from "./canvas";

export enum GameRole {
	DRAWING = "DRAWING",
	GUESSING = "GUESSING",
	PICKING = "PICKING",
}

export type GameState = {
	startsAt: string;
	totalRounds: number;
	currentRound: number;
	strokes: Stroke[];
	word: string;
	currentPhaseDeadline: string;
};
