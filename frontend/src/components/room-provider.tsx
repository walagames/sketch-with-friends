import { useRoom } from "@/hooks/room";
import { createContext, useContext, useEffect, useState } from "react";
import { Player, PlayerAction, RoomState } from "../lib/types";

interface RoomContextType {
	sendEvent: (type: PlayerAction, payload: any) => void;
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
		name: "",
		role: "",
		code: "",
		players: [] as Player[],
		points: [] as number[][],
	} as RoomState,
};
const RoomContext = createContext<RoomContextType>(defaultContextValue);

export const useRoomContext = () => useContext(RoomContext);

export const RoomProvider = ({ children }: { children: React.ReactNode }) => {
	const [state, setState] = useState({
		socketUrl: "",
		name: "",
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
	
	const createRoom = (username: string) => {
		console.log("called");
		setState({
			...state,
			name: username,
			socketUrl: `ws://${import.meta.env.VITE_SOCKET_HOST}/connect`,
		});
	};
	
	const updateRoom = (changes: Partial<RoomState>) => {
		setState((prev) => ({
			...prev,
			code: changes.code,
		}));
	};
	const [sendEvent] = useRoom(state.socketUrl, handleStroke, updateRoom);

	const joinRoom = (code: string) => {
		setState({
			...state,
			socketUrl: `ws://${import.meta.env.VITE_SOCKET_HOST}/connect?room=${code}`,
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
