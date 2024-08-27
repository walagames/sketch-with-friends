import { Stroke } from "./canvas";

export enum GameRole {
	DRAWING = "DRAWING",
	GUESSING = "GUESSING",
	PICKING = "PICKING",
}

export type GameState = {
	startsAt: string;
	strokes: Stroke[];
	word: string;
	role: GameRole;
	round: number;
	roundEndsAt: string;
};
