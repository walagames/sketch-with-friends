import React from "react";
import { RoomEvent } from "@/types/room";

interface UseRoomOptions {
	onConnect?: (event: Event) => void;
	onClose?: (event: CloseEvent) => void;
	onError?: (event: Event) => void;
	onMessage?: (event: MessageEvent) => void;
}

export const useRoom = (
	url: string | null,
	options?: UseRoomOptions
): [(event: RoomEvent) => void] => {
	// We store the connection in a ref so the connection persists between renders
	const socketRef = React.useRef<WebSocket | null>(null);
	const connectionOpenedRef = React.useRef(false);

	React.useEffect(() => {
		// Only enter if the connection is not already opened
		if (connectionOpenedRef.current && url) {
			const socket = (socketRef.current = new WebSocket(url));

			socket.onmessage = (event: MessageEvent) => options?.onMessage?.(event);
			socket.onopen = (event: Event) => options?.onConnect?.(event);
			socket.onclose = (event: CloseEvent) => options?.onClose?.(event);
			socket.onerror = (event: Event) => options?.onError?.(event);

			// Cleanup the connection when the component unmounts
			return () => socket.close();
		}

		// This return runs when the component re-renders or if dependencies change
		// We set the connectionOpenedRef to true to ensure that the connection is only opened once
		return () => {
			connectionOpenedRef.current = true;
		};
	}, [url, options]);

	const sendEvent = (event: RoomEvent) =>
		socketRef.current?.send(JSON.stringify(event));

	return [sendEvent];
};
