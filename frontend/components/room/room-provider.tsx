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
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { RoomEvent, RoomEventType, RoomState, RoomStatus } from "@/types/room";
import { Stroke } from "@/types/canvas";
import { Player } from "@/types/player";

interface RoomContextType {
	handleEvent: (event: RoomEvent) => void;
	handleRoomFormSubmit: (username: string) => void;
	room: RoomState;
}
const defaultContext: RoomContextType = {
	handleEvent: () => {},
	handleRoomFormSubmit: () => {},
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
		case RoomEventType.CLEAR_STROKES:
			return { ...state, game: { ...state.game, strokes: [] } };
		case RoomEventType.UNDO_STROKE:
			return { ...state, game: { ...state.game, strokes: state.game.strokes.slice(0, -1) } };
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

// TODO: store canvas tool state and stroke settings here and pass down to children via context
export const RoomProvider = ({ children }: { children: React.ReactNode }) => {
	const [socketUrl, setSocketUrl] = useState<string | null>(null);

	const [room, dispatch] = useReducer(reducer, defaultContext.room);

	const searchParams = useSearchParams();

	const roomOptions = useMemo(
		() => ({
			onClose: () => {
				if (!room.code) return;
				const url = new URL(window.location.href);
				url.searchParams.delete("room");
				history.pushState({}, "", url.toString());
				setSocketUrl(null);
				dispatch({ type: RoomEventType.CLEAR_STATE });
			},
			onMessage: (event: MessageEvent) => {
				console.log("onMessage", event);
				const { type, payload } = JSON.parse(event.data);
				dispatch({ type, payload });
			},
			onConnect: () => toast.success("Connected to room"),
			onError: () => {
				toast.error("Failed to connect to room");
				setSocketUrl(null);
			},
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

	const handleRoomFormSubmit = useCallback(
		(username: string) => {
			const roomCode = searchParams.get("room");
			if (roomCode) {
				setSocketUrl(getRealtimeHref() + "/join/" + roomCode);
			} else {
				setSocketUrl(getRealtimeHref() + "/host");
			}
		},
		[searchParams]
	);

	const contextValue = useMemo(
		() => ({
			room,
			handleEvent,
			handleRoomFormSubmit,
		}),
		[room, handleEvent, handleRoomFormSubmit]
	);

	return (
		<RoomContext.Provider value={contextValue}>{children}</RoomContext.Provider>
	);
};
