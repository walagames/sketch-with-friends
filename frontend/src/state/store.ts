import { combineReducers, configureStore, Middleware } from "@reduxjs/toolkit";
import canvasReducer from "./features/canvas";
import roomReducer from "./features/room";
import gameReducer from "./features/game";
import clientReducer from "./features/client";
import preferencesReducer, { PreferencesState } from "./features/preferences";
import { clearQueryParams } from "@/lib/params";
import { toast } from "sonner";
import localStorage from "redux-persist/es/storage";
import { persistReducer, persistStore } from "redux-persist";
import { Avatar } from "@/lib/avatar";

// Used to display toast notifications from the server
const ErrorMessages = {
	ErrRoomNotFound: "Room not found",
	ErrRoomFull: "Room is full",
	ErrRoomClosed: "Room closed",
	ErrConnectionTimeout: "Connection timed out",
	ErrRoomIdle: "Room closed because it was inactive for too long",
	ErrPlayerIdle: "You were inactive for too long and were kicked",
	ErrNameTooLong: "Name is too long",
};

const socketMiddleware: Middleware = (store) => {
	let socket: WebSocket | null = null;

	function clearStateAfterDelay() {
		setTimeout(() => {
			store.dispatch({ type: "room/reset", fromServer: true });
			store.dispatch({ type: "game/reset", fromServer: true });
			store.dispatch({ type: "client/reset", fromServer: true });
			store.dispatch({ type: "canvas/reset", fromServer: true });
		}, 100);
	}

	return (next) => (action: any) => {
		switch (action.type) {
			case "socket/connect":
				if (socket !== null) {
					socket.close();
				}

				socket = new WebSocket(action.payload);

				socket.onclose = (e) => {
					const errorMessage =
						ErrorMessages[e.reason as keyof typeof ErrorMessages];

					if (e.reason) {
						toast.error(errorMessage || "Unknown error occurred");
					}

					// Clear the code from the url if the room does not exist
					if (e.reason === "ErrRoomNotFound") {
						clearQueryParams();
					}

					// Clear after short delay to avoid visual shift if disconnect is caused by page reload
					clearStateAfterDelay();
				};

				socket.onopen = () => {
					socket?.send(
						JSON.stringify({
							type: "room/changePlayerProfile",
							payload: store.getState().preferences,
						})
					);
				};

				socket.onmessage = (event) => {
					const actions = JSON.parse(event.data);
					actions.forEach((action: any) => {
						if (
							action.type === "error" ||
							action.type === "warning" ||
							action.type === "info"
						) {
							toast(action.payload || "Unknown error occurred");
						} else {
							store.dispatch({
								...action,
								fromServer: true,
							});
						}
					});
				};

				break;
			case "socket/disconnect":
				if (socket !== null) {
					socket.close();
					clearStateAfterDelay();
				}
				socket = null;

				break;
			default:
				// Check if the action should be sent to the server
				//
				// The client slice is not meant to be synced with the server
				// and is only used on the client.
				//
				// Actions that are dispatched from the websocket middleware are marked with
				// fromServer: true, so we don't re-send them to the server.
				if (
					!action.type.startsWith("client") &&
					!action.type.startsWith("preferences") &&
					!action.fromServer
				) {
					if (!action.payload) {
						action.payload = null;
					}
					socket?.send(JSON.stringify(action));
				}
				return next(action);
		}
	};
};

const persistConfig = {
	key: "root",
	storage: localStorage,
	whitelist: ["preferences"],
	transforms: [
		{
			in: (state: PreferencesState) => state,
			out: (state: Partial<PreferencesState>) => {
				const defaultState = {
					volume: 0.5,
					username: "",
					avatarConfig: Avatar.random(),
					customWords: [],
				};

				// If state is null or undefined, return default state
				if (!state) return defaultState;

				// Merge the stored state with default values for any missing fields
				return {
					volume: state.volume ?? defaultState.volume,
					username: state.username ?? defaultState.username,
					avatarConfig: {
						...defaultState.avatarConfig,
						...state.avatarConfig,
					},
					customWords: state.customWords ?? defaultState.customWords,
				};
			},
		},
	],
};

const persistedReducer = persistReducer(
	persistConfig,
	combineReducers({
		canvas: canvasReducer,
		room: roomReducer,
		game: gameReducer,
		client: clientReducer,
		preferences: preferencesReducer,
	})
);

export const store = configureStore({
	devTools: false,
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({ serializableCheck: false }).concat(socketMiddleware),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
