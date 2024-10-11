import { toast } from "sonner";

export const getRealtimeHref = () => {
	const protocol = import.meta.env.DEV ? "ws" : "wss";
	const host = import.meta.env.DEV
		? "localhost:8080"
		: import.meta.env.SOCKET_HOST;
	console.log(import.meta.env.SOCKET_HOST);
	return `${protocol}://${host}`;
};

export const copyRoomLink = (roomId: string) => {
	navigator.clipboard.writeText(`${window.location.origin}/?room=${roomId}`);
	toast.success("Room link copied to clipboard");
};
