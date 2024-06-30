import { useEffect, useRef } from "react";
import { PlayerAction, RoomEvent } from "@/lib/types";
import { toast } from "sonner";

export const useRoom = (
	url: string,
	handleEvent: (type: RoomEvent, payload: unknown) => void
): [(type: PlayerAction, payload: unknown) => void] => {
	const socketRef = useRef<WebSocket | null>(null);
	const mountedRef = useRef(false);

	useEffect(() => {
		if (mountedRef.current && url) {
			socketRef.current = new WebSocket(url);
			const socket = socketRef.current;

			socket.onopen = () => {
				toast("Connection started");
			};

			socket.onmessage = (event: MessageEvent) => {
				console.log(
					"Received message from server:",
					JSON.stringify(event.data, null, 2)
				);
				const { type, payload } = JSON.parse(event.data);
				handleEvent(type, payload);
			};

			socket.onclose = () => {
				toast.error("Disconnected from room");
			};

			socket.onerror = () => {
				toast.error("Room connection failed");
			};

			return () => {
				socket.close();
			};
		}

		return () => {
			mountedRef.current = true;
		};
	}, [url, handleEvent]);

	const sendEvent = (type: PlayerAction, payload: unknown) => {
		if (!socketRef.current) return;

		socketRef.current.send(JSON.stringify({ type, payload }));
	};

	return [sendEvent];
};
