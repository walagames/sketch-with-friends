export type Player = {
	id: string;
	name: string;
	role: PlayerRole;
	status: PlayerConnectionStatus;
};

export enum PlayerRole {
	HOST = "HOST",
	PLAYER = "PLAYER",
}

export enum PlayerConnectionStatus {
	JOINING = "JOINING",
	CONNECTED = "CONNECTED",
}