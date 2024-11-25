import { combineReducers, configureStore, Middleware } from "@reduxjs/toolkit";
import canvasReducer from "./features/canvas";
import roomReducer from "./features/room";
import gameReducer from "./features/game";
import clientReducer from "./features/client";
import preferencesReducer from "./features/preferences";
import { clearQueryParams } from "@/lib/params";
import { toast } from "sonner";
import localStorage from "redux-persist/es/storage";
import { persistReducer, persistStore } from "redux-persist";

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
					toast.error(errorMessage || "Unknown error occurred");

					// Clear the code from the url if the room does not exist
					if (e.reason === "ErrRoomNotFound") {
						clearQueryParams();
					}

					// Clear after short delay to avoid visual shift if disconnect is caused by page reload
					clearStateAfterDelay();
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
	whitelist: ["preferences"], // only preferences will be persisted
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
