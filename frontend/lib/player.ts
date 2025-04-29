import { GameRole } from "@/state/features/game";
import { Player } from "@/state/features/room";

export function getRoomRole(playerId: string, players: Record<string, Player>) {
	return players[playerId]?.roomRole ?? GameRole.Guessing;
}

export function getGameRole(playerId: string, players: Record<string, Player>) {
	return players[playerId]?.gameRole ?? GameRole.Guessing;
}

export function getDrawingPlayer(players: Record<string, Player>) {
	return Object.values(players).find((p) => p.gameRole === GameRole.Drawing);
}
