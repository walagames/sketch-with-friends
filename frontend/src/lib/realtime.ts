import { toast } from "sonner";

export const getRealtimeHref = () => {
	const isDev = import.meta.env.DEV;
	const protocol = isDev ? "ws" : "wss";
	const branchSocketHost = import.meta.env.BRANCH_SOCKET_HOST;
	const socketHost = import.meta.env.SOCKET_HOST;

	let host;
	if (socketHost) {
		host = socketHost;
	} else if (branchSocketHost) {
		host = branchSocketHost;
	}
	return `${protocol}://${host}`;
};

export const copyRoomLink = (roomId: string) => {
	navigator.clipboard.writeText(`${window.location.origin}/?room=${roomId}`);
	toast.success("Room link copied to clipboard");
};
