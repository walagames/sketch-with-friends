"use client";

import { useRoom } from "@/hooks/use-room";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useReducer,
	useState,
} from "react";
import { RoomEvent, RoomEventType, RoomState, RoomStatus } from "@/types/room";
import { Stroke } from "@/types/canvas";
import { Player } from "@/types/player";
import { toast } from "sonner";

interface RoomContextType {
	handleEvent: (event: RoomEvent) => void;
	createRoom: () => void;
	joinRoom: (code: string) => void;
	room: RoomState;
}
const defaultContext: RoomContextType = {
	handleEvent: () => {},
	createRoom: () => {},
	joinRoom: () => {},
	room: {
		role: "",
		code: "",
		players: [] as Player[],
		status: RoomStatus.WAITING,
		game: {
			strokes: [] as Stroke[],
		},
	} as RoomState,
};
const RoomContext = createContext<RoomContextType>(defaultContext);
export const useRoomContext = () => useContext(RoomContext);

const reducer = (state: RoomState, event: RoomEvent) => {
	switch (event.type) {
		case RoomEventType.NEW_STROKE:
			return {
				...state,
				game: {
					...state.game,
					strokes: [...state.game.strokes, event.payload],
				},
			};
		case RoomEventType.STROKE_POINT:
			if (state.game.strokes.length === 0) {
				return state;
			}
			const copy = [...state.game.strokes];
			copy[copy.length - 1].points.push(event.payload);
			return { ...state, game: { ...state.game, strokes: copy } };
		case RoomEventType.INITIAL_STATE:
			return { ...state, ...event.payload };
		case RoomEventType.CLEAR_STATE:
			return defaultContext.room;
		default:
			return state;
	}
};

const getRealtimeHref = () => {
	const protocol = process.env.NODE_ENV === "development" ? "ws" : "wss";
	const host =
		process.env.NEXT_PUBLIC_SOCKET_HOST || "realtime-" + window.location.host;
	return `${protocol}://${host}`;
};

export const RoomProvider = ({ children }: { children: React.ReactNode }) => {
	const [socketUrl, setSocketUrl] = useState<string | null>(null);
	const [room, dispatch] = useReducer(reducer, defaultContext.room);

	const roomOptions = useMemo(
		() => ({
			onClose: () => {
				toast.info("Disconnected from room");
				const url = new URL(window.location.href);
				url.searchParams.delete("room");
				history.pushState({}, "", url.toString());
				setSocketUrl(null);
				dispatch({ type: RoomEventType.CLEAR_STATE });
			},
			onMessage: (event: MessageEvent) => {
				const { type, payload } = JSON.parse(event.data);
				dispatch({ type, payload });
			},
			onConnect: () => toast.success("Connected to room"),
			onError: () => toast.error("Room connection failed"),
		}),
		[]
	);

	const [sendEvent] = useRoom(socketUrl, roomOptions);

	const handleEvent = useCallback(
		(event: RoomEvent) => {
			dispatch(event);
			sendEvent(event);
		},
		[sendEvent]
	);

	const createRoom = useCallback(
		() => setSocketUrl(getRealtimeHref() + "/host"),
		[]
	);
	const joinRoom = useCallback(
		(code: string) => setSocketUrl(getRealtimeHref() + "/join/" + code),
		[]
	);

	const contextValue = useMemo(
		() => ({
			room,
			handleEvent,
			createRoom,
			joinRoom,
		}),
		[room, handleEvent, createRoom, joinRoom]
	);

	return (
		<RoomContext.Provider value={contextValue}>{children}</RoomContext.Provider>
	);
};
