import { GameRole } from "./game";

export type Player = {
	id: string;
	name: string;
	role: PlayerRole;
	status: PlayerConnectionStatus;
	avatarSeed: string;
	avatarColor: string;
	score: number;
	gameRole: GameRole;
};

export enum PlayerRole {
	HOST = "HOST",
	PLAYER = "PLAYER",
}

export enum PlayerConnectionStatus {
	JOINING = "JOINING",
	CONNECTED = "CONNECTED",
}


