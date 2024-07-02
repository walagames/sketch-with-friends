"use client"
import { useRoom } from "@/hooks/room";
import { createContext, useCallback, useContext, useState } from "react";
import { Player, PlayerAction, RoomEvent, RoomState } from "../lib/types";
import { toast } from "sonner";

interface RoomContextType {
	sendEvent: (type: PlayerAction, payload: unknown) => void;
	createRoom: (username: string) => void;
	updateRoom: (changes: Partial<RoomState>) => void;
	joinRoom: (code: string) => void;
	state: RoomState;
	handleStrokeStart: (point: number[]) => void;
	handleStroke: (point: number[]) => void;
}

const defaultContextValue: RoomContextType = {
	sendEvent: () => {},
	createRoom: () => {},
	updateRoom: () => {},
	joinRoom: () => {},
	handleStrokeStart: () => {},
	handleStroke: () => {},
	state: {
		socketUrl: "",
		role: "",
		code: "",
		players: [] as Player[],
		points: [] as number[][],
	} as RoomState,
};
const RoomContext = createContext<RoomContextType>(defaultContextValue);

export const useRoomContext = () => useContext(RoomContext);

export const RoomProvider = ({ children, endpoint }: { children: React.ReactNode, endpoint: string }) => {
	const [state, setState] = useState<RoomState>({
		socketUrl: "",
		role: "",
		code: "",
		players: [] as Player[],
		points: [] as number[][],
	});

	const handleStrokeStart = (point: number[]) => {
		setState({
			...state,
			points: [point],
		});
	};
	const handleStroke = (point: number[]) => {
		setState((prev) => ({
			...prev,
			points: [...prev.points, point],
		}));
	};

	const createRoom = () => {
		console.log("called");
		setState({
			...state,
			socketUrl: `${process.env.NODE_ENV === "development" ? "ws" : "wss"}://${
				process.env.NEXT_PUBLIC_SOCKET_HOST || "realtime" + window.location.host
			}/connect`,
		});
	};

	const handleEvent = useCallback((type: RoomEvent, payload: unknown) => {
		switch (type) {
			case RoomEvent.MESSAGE:
				toast(JSON.stringify(payload, null, 2));
				break;
			case RoomEvent.ROOM_STATE: {
				const roomState = payload as RoomState;
				console.log(roomState);
				updateRoom({
					code: roomState.code,
				});
				break;
			}
			case RoomEvent.NEW_ROUND:
				toast(JSON.stringify(payload, null, 2));
				break;
			case RoomEvent.GAME_START:
				break;
			case RoomEvent.STROKE: {
				const stroke = payload as number[];
				handleStroke(stroke);
				break;
			}
			default:
				console.log(`Unhandled event type: ${type}`);
				break;
		}
	}, []);

	const updateRoom = (changes: Partial<RoomState>) => {
		setState((prev) => ({
			...prev,
			...changes,
		}));
	};
	const [sendEvent] = useRoom(state.socketUrl, handleEvent);

	const joinRoom = (code: string) => {
		setState({
			...state,
			socketUrl: `${process.env.NODE_ENV === "development" ? "ws" : "wss"}://${
				process.env.NEXT_PUBLIC_SOCKET_HOST || "realtime" + window.location.host
			}/connect?room=${code}`,
		});
	};

	return (
		<RoomContext.Provider
			value={{
				sendEvent,
				createRoom,
				joinRoom,
				state,
				updateRoom,
				handleStrokeStart,
				handleStroke,
			}}
		>
			{children}
		</RoomContext.Provider>
	);
};
