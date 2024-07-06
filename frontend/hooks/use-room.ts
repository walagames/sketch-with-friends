import { Dispatch, useEffect, useRef } from "react";
import { RoomEvent } from "@/types/room";
import { toast } from "sonner";

export const useRoom = (
	url: string | null,
	dispatch: Dispatch<RoomEvent>
): [(event: RoomEvent) => void] => {
	const socketRef = useRef<WebSocket | null>(null);
	const mountedRef = useRef(false);

	useEffect(() => {
		if (mountedRef.current && url) {
			const socket = (socketRef.current = new WebSocket(url));

			socket.onopen = () => toast.success("Connected to room");
			socket.onclose = () => toast.info("Disconnected from room");
			socket.onerror = () => toast.error("Room connection failed");

			socket.onmessage = (event: MessageEvent) => {
				const { type, payload } = JSON.parse(event.data);
				dispatch({ type, payload } as RoomEvent);
			};

			return () => socket.close();
		}

		return () => {
			mountedRef.current = true;
		};
	}, [url, dispatch]);

	const sendEvent = (event: RoomEvent) => {
		if (!socketRef.current) return;

		socketRef.current.send(JSON.stringify(event));
	};

	return [sendEvent];
};
