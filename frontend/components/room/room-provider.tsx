"use client";
import { useRoom } from "@/hooks/use-room";
import {
	createContext,
	useCallback,
	useContext,
	useReducer,
	useState,
} from "react";
import { RoomEvent, RoomEventType, RoomState } from "@/types/room";
import { Stroke } from "@/types/canvas";
import { Player } from "@/types/player";

interface RoomContextType {
	dispatchEvent: (event: RoomEvent) => void;
	createRoom: () => void;
	joinRoom: (code: string) => void;
	room: RoomState;
}

const defaultContext: RoomContextType = {
	dispatchEvent: () => {},
	createRoom: () => {},
	joinRoom: () => {},
	room: {
		socketUrl: "",
		role: "",
		code: "",
		players: [] as Player[],
		strokes: [] as Stroke[],
	} as RoomState,
};
const RoomContext = createContext<RoomContextType>(defaultContext);
export const useRoomContext = () => useContext(RoomContext);

function reducer(state: RoomState, event: RoomEvent) {
	switch (event.type) {
		case RoomEventType.NEW_STROKE:
			return { ...state, strokes: [...state.strokes, event.payload] };
		case RoomEventType.STROKE_POINT:
			if (state.strokes.length === 0) {
				return state;
			}
			const copy = [...state.strokes];
			copy[copy.length - 1].points.push(event.payload);
			return { ...state, strokes: copy };
		case RoomEventType.INITIAL_STATE:
			return { ...state, ...event.payload };

		default:
			return state;
	}
}

const getEndpoint = () => {
	const protocol = process.env.NODE_ENV === "development" ? "ws" : "wss";
	const host =
		process.env.NEXT_PUBLIC_SOCKET_HOST || "realtime-" + window.location.host;
	console.log(host, protocol);
	return `${protocol}://${host}`;
};

export const RoomProvider = ({ children }: { children: React.ReactNode }) => {
	const [room, dispatch] = useReducer(reducer, defaultContext.room);

	const [url, setUrl] = useState<string | null>(null);
	const [sendEvent] = useRoom(url, dispatch);

	const dispatchEvent = (event: RoomEvent) => {
		dispatch(event);
		sendEvent(event);
	};

	const createRoom = () => setUrl(getEndpoint() + "/host");
	const joinRoom = (code: string) => setUrl(getEndpoint() + "/join/" + code);

	return (
		<RoomContext.Provider
			value={{
				room,
				dispatchEvent,
				createRoom,
				joinRoom,
			}}
		>
			{children}
		</RoomContext.Provider>
	);
};
