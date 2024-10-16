import { toast } from "sonner";

export const getRealtimeHref = () => {
	const isDev = import.meta.env.DEV;
	const protocol = isDev ? "ws" : "wss";
	const isBranch = import.meta.env.BRANCH_SOCKET_HOST;

	const host = isDev
		? "localhost:8080"
		: isBranch
		? import.meta.env.BRANCH_SOCKET_HOST
		: "realtime.sketchwithfriends.com";
	return `${protocol}://${host}`;
};

export const copyRoomLink = (roomId: string) => {
	navigator.clipboard.writeText(`${window.location.origin}/?room=${roomId}`);
	toast.success("Room link copied to clipboard");
};
