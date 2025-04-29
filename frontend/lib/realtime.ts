import { toast } from "sonner";

export const getRealtimeHref = () => {
	const isDev = process.env.NODE_ENV === "development";
	const protocol = isDev ? "ws" : "wss";
	const branchSocketHost = process.env.BRANCH_SOCKET_HOST;
	const socketHost = process.env.NEXT_PUBLIC_SOCKET_HOST;

	let host;
	if (socketHost) {
		host = socketHost;
	} else if (branchSocketHost) {
		host = branchSocketHost;
	}
	return `${protocol}://${host}`;
};

export const copyInviteLink = (roomId: string) => {
	navigator.clipboard.writeText(`${window.location.origin}/?room=${roomId}`);
	toast.success("Invite link copied to clipboard");
};
