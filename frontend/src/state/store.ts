import { configureStore, Middleware } from "@reduxjs/toolkit";
import canvasReducer from "./features/canvas";
import roomReducer from "./features/room";
import gameReducer from "./features/game";
import clientReducer, { enterRoomCode } from "./features/client";
import { clearQueryParams } from "@/lib/params";
import { toast } from "sonner";

// const logger: Middleware = (store) => (next) => (action) => {
// 	console.log("dispatching", action);
// 	const result = next(action);
// 	console.log("next state", store.getState());
// 	return result;
// };

enum ConnectionError {
	RoomNotFound = "ErrRoomNotFound",
	RoomFull = "ErrRoomFull",
	RoomClosed = "ErrRoomClosed",
	ConnectionTimeout = "ErrConnectionTimeout",
}

const socketMiddleware: Middleware = (store) => {
	let socket: WebSocket | null = null;

	return (next) => (action: any) => {
		switch (action.type) {
			case "socket/connect":
				if (socket !== null) {
					socket.close();
				}

				socket = new WebSocket(action.payload);

				socket.onclose = (e) => {
					switch (e.reason) {
						case ConnectionError.RoomNotFound:
							toast.error("Room not found");
							clearQueryParams();
							store.dispatch(enterRoomCode(""));
							break;
						case ConnectionError.RoomFull:
							toast.error("Room is full");
							store.dispatch(enterRoomCode(""));
							break;
						case ConnectionError.ConnectionTimeout:
							toast.error("Connection timed out");
							store.dispatch(enterRoomCode(""));
							break;
						default:
							toast.error(e.reason ? e.reason : "Disconnected from server");
							break;
					}
					setTimeout(() => {
						store.dispatch({ type: "room/reset", fromServer: true });
						store.dispatch({ type: "game/reset", fromServer: true });
						store.dispatch({ type: "client/reset", fromServer: true });
					}, 100);
				};
				socket.onmessage = (event) => {
					const actions = JSON.parse(event.data);
					actions.forEach((action: any) => {
						if (action.type === "error") {
							toast.error(action.payload);
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
				if (!action.type.startsWith("client") && !action.fromServer) {
					// console.log("sending action to server", action);
					if (!action.payload) {
						action.payload = null;
					}
					socket?.send(JSON.stringify(action));
				}
				return next(action);
		}
	};
};

export const store = configureStore({
	devTools: false,
	reducer: {
		canvas: canvasReducer,
		room: roomReducer,
		game: gameReducer,
		client: clientReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({ serializableCheck: false }).concat(
			// logger,
			socketMiddleware
		),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
