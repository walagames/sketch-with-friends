import { useEffect, useRef, useCallback } from "react";
import { PlayerAction, RoomEvent } from "@/lib/types";
import { toast } from "sonner";
import { useRoomContext } from "@/components/room-provider";

export const useRoom = (
	url: string,
	onStroke: (point: [number, number]) => void,
	updateRoom: (changes: Partial<RoomState>) => void
): [(type: PlayerAction, payload: any) => void] => {
	const socket = useRef<WebSocket | null>(null);
	const mountedRef = useRef(false);

	console.log("run:", url);

	useEffect(() => {
		if (mountedRef.current && url) {
			socket.current = new WebSocket(url);

			socket.current.onopen = () => {
				toast("Connection started");
			};

			socket.current.onmessage = (event) => {
				console.log(
					"Received message from server:",
					JSON.stringify(event.data, null, 2)
				);
				const { type, payload } = JSON.parse(event.data);
				console.log("type: ", type);
				console.log("payload: ", payload);
				handleEvent(type, payload);
			};

			socket.current.onclose = (e) => {
				// roomStore$.socketUrl.set("");
				toast.error("Disconnected from lobby");
			};

			socket.current.onerror = () => {
				// roomStore$.socketUrl.set("");
				toast.error("Room connection failed");
			};

			return () => {
				socket.current?.close();
			};
		}

		return () => {
			mountedRef.current = true;
		};
	}, [url]);

	const sendEvent = useCallback(
		(type: PlayerAction, payload: any) => {
			if (socket.current) {
				socket.current.send(JSON.stringify({ type, payload }));
			}
		},
		[socket.current]
	);

	const handleEvent = useCallback((type: RoomEvent, payload: any) => {
		switch (type) {
			case RoomEvent.MESSAGE:
				toast(payload);
				break;
			case RoomEvent.ROOM_STATE:
				console.log(payload.code);
				updateRoom({
					code: payload.code,
				});
				break;
			case RoomEvent.NEW_ROUND:
				// toast(JSON.stringify(payload, null, 2));
				break;
			case RoomEvent.UPDATE_SCORES:
				// toast(JSON.stringify(payload, null, 2));
				break;
			case RoomEvent.GAME_OVER:
				break;
			case RoomEvent.GAME_START:
				break;
			case RoomEvent.STROKE:
				console.log(payload);
				onStroke(payload);
				break;
			default:
				console.log(`Unhandled event type: ${type}`);
				break;
		}
	}, []);

	return [sendEvent];
};
