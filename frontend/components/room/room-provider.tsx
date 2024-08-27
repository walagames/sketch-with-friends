"use client";

import { useRoom } from "@/hooks/use-room";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useReducer,
	useState,
	useEffect,
} from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { RoomEvent, RoomEventType, RoomState, RoomStatus } from "@/types/room";
import {
	CanvasAction,
	CanvasToolSettings,
	SettingActionType,
	Stroke,
	Tool,
} from "@/types/canvas";
import { Player, PlayerRole } from "@/types/player";

interface RoomContextType {
	handleEvent: (event: RoomEvent) => void;
	handleRoomFormSubmit: (
		username: string,
		avatarSeed: string,
		avatarColor: string
	) => void;
	room: RoomState;
	settings: CanvasToolSettings;
	updateSettings: (action: CanvasAction) => void;
	playerId: string;
}
const defaultContext: RoomContextType = {
	updateSettings: () => {},
	handleEvent: () => {},
	handleRoomFormSubmit: () => {},
	settings: {
		color: "#000000",
		strokeWidth: 8,
		tool: Tool.BRUSH,
	},
	room: {
		code: "",
		players: [] as Player[],
		status: RoomStatus.UNINITIALIZED,
		game: {
			strokes: [] as Stroke[],
			startsAt: "",
		},
	} as RoomState,
	playerId: "",
};
const RoomContext = createContext<RoomContextType>(defaultContext);
export const useRoomContext = () => useContext(RoomContext);

const roomReducer = (state: RoomState, event: RoomEvent) => {
	switch (event.type) {
		case RoomEventType.STROKE:
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
		case RoomEventType.STATE:
			return { ...state, ...event.payload };
		case RoomEventType.CLEAR_STATE:
			return defaultContext.room;
		case RoomEventType.CLEAR_STROKES:
			return { ...state, game: { ...state.game, strokes: [] } };
		case RoomEventType.UNDO_STROKE:
			return {
				...state,
				game: { ...state.game, strokes: state.game.strokes.slice(0, -1) },
			};
		case RoomEventType.PLAYER_JOINED:
			return { ...state, players: [...state.players, event.payload] };
		case RoomEventType.PLAYER_LEFT:
			return {
				...state,
				players: state.players.filter(
					(player) => player.id !== event.payload.id
				),
			};
		case RoomEventType.HOST_CHANGED:
			return {
				...state,
				players: state.players.map((player) =>
					player.id === event.payload.id
						? { ...player, role: PlayerRole.HOST }
						: player
				),
			};
		case RoomEventType.GAME_STARTED:
			return {
				...state,
				game: { ...state.game, startsAt: event.payload },
			};
		case RoomEventType.CHANGE_SETTINGS:
			return {
				...state,
				settings: { ...state.settings, ...event.payload },
			};
		default:
			return state;
	}
};

const settingsReducer = (state: CanvasToolSettings, action: CanvasAction) => {
	switch (action.type) {
		case SettingActionType.CHANGE_COLOR:
			return { ...state, color: action.payload };
		case SettingActionType.CHANGE_STROKE_WIDTH:
			return { ...state, strokeWidth: action.payload };
		case SettingActionType.CHANGE_TOOL:
			return { ...state, tool: action.payload };
		default:
			return state;
	}
};

const getRealtimeHref = () => {
	const protocol = process.env.NODE_ENV === "development" ? "ws" : "wss";
	const host =
		process.env.NEXT_PUBLIC_SOCKET_HOST ?? "realtime-" + window.location.host;
	return `${protocol}://${host}`;
};

export const RoomProvider = ({ children }: { children: React.ReactNode }) => {
	const [socketUrl, setSocketUrl] = useState<string | null>(null);

	const [room, updateRoom] = useReducer(roomReducer, defaultContext.room);

	const [playerId, setPlayerId] = useState<string>("");

	const [settings, updateSettings] = useReducer(
		settingsReducer,
		defaultContext.settings
	);

	const searchParams = useSearchParams();

	const router = useRouter();

	const roomOptions = useMemo(
		() => ({
			onClose: (event: CloseEvent) => {
				updateRoom({ type: RoomEventType.CLEAR_STATE });
				setSocketUrl(null);
				router.replace("/");
				toast.error(event.reason ?? "Connection closed");
			},
			onMessage: (event: MessageEvent) => {
				const { type, payload } = JSON.parse(event.data);
				if (type === "INITIALIZE_PLAYER_ID") {
					setPlayerId(payload);
					return;
				}
				console.log(event);
				updateRoom({ type, payload });
			},
			onConnect: (event: Event) => {
				// toast.success("Connected to room");
			},
		}),
		[router]
	);

	const [sendEvent] = useRoom(socketUrl, roomOptions);

	const handleEvent = useCallback(
		(event: RoomEvent) => {
			updateRoom(event);
			sendEvent(event);
		},
		[sendEvent]
	);

	useEffect(() => {
		if (!searchParams.get("room") && room.code) {
			router.push("?room=" + room.code);
		}
	}, [room.code, searchParams, router]);

	const handleRoomFormSubmit = useCallback(
		(username: string, avatarSeed: string, avatarColor: string) => {
			const roomCode = searchParams.get("room");
			if (roomCode) {
				setSocketUrl(
					getRealtimeHref() +
						"/join/" +
						roomCode +
						"?username=" +
						username +
						"&avatarSeed=" +
						avatarSeed +
						"&avatarColor=" +
						avatarColor
				);
			} else {
				setSocketUrl(
					getRealtimeHref() +
						"/host?username=" +
						username +
						"&avatarSeed=" +
						avatarSeed +
						"&avatarColor=" +
						avatarColor
				);
			}
		},
		[searchParams]
	);

	const contextValue = useMemo(
		() => ({
			room,
			playerId,
			handleEvent,
			handleRoomFormSubmit,
			settings,
			updateSettings,
		}),
		[room, handleEvent, handleRoomFormSubmit, settings, playerId]
	);

	return (
		<RoomContext.Provider value={contextValue}>{children}</RoomContext.Provider>
	);
};
