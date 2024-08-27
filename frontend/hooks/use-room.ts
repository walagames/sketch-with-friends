"use client";
import React from "react";
import { RoomEvent } from "@/types/room";

interface UseRoomOptions {
	onConnect?: (event: Event) => void;
	onClose?: (event: CloseEvent) => void;
	onError?: (event: Event) => void;
	onMessage?: (event: MessageEvent) => void;
}

/**
 * Custom hook for managing a room WebSocket connection.
 *
 * @param url - The WebSocket URL to connect to. If null, no connection is established.
 * @param options - Optional configuration for connection callbacks.
 * @param options.onConnect - Callback function triggered when the connection is established.
 * @param options.onClose - Callback function triggered when the connection is closed.
 * @param options.onError - Callback function triggered when a connection error occurs.
 * @param options.onMessage - Callback function triggered when a message is received.
 *
 * @returns An array containing a function to send events through the WebSocket connection.
 *
 * @example
 * const [sendEvent] = useRoom(wsUrl, dispatch, {
 *   onConnect: () => console.log('Connected'),
 *   onClose: () => console.log('Disconnected'),
 *   onError: () => console.error('Connection error'),
 *   onMessage: (event: MessageEvent) => console.log('Received event', event)
 * });
 *
 * sendEvent({ type: RoomEventType.NEW_STROKE, payload: strokeData });
 *
 * @note The connection is only established when a non-null URL is provided. If the URL is null,
 * the hook will not attempt to create a WebSocket connection.
 */
export const useRoom = (
	url: string | null,
	options?: UseRoomOptions
): [(event: RoomEvent) => void] => {
	// We store the connection in a ref so the connection persists between renders
	const socketRef = React.useRef<WebSocket | null>(null);
	// Kind of a hack to make sure the connection is only opened once (react strict mode)
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
		// We set the connectionOpenedRef to true to ensure that the connection is only opened once (react strict mode)
		return () => {
			connectionOpenedRef.current = true;
		};
	}, [url, options]);

	const sendEvent = (event: RoomEvent) =>
		socketRef.current?.send(JSON.stringify(event));

	return [sendEvent];
};
