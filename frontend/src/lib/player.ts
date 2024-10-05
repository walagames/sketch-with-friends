import { GameRole } from "@/types/game";
import { Player, PlayerRole } from "@/types/player";

export function getPlayerRole(playerId: string, players: Player[]) {
	return players.find((p) => p.id === playerId)?.role ?? PlayerRole.PLAYER;
}

export function getGameRole(playerId: string, players: Player[]) {
	return players.find((p) => p.id === playerId)?.gameRole ?? GameRole.GUESSING;
}

export function getPickingPlayer(players: Player[]) {
	return players.find((p) => p.gameRole === GameRole.PICKING);
}
