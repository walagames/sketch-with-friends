import { configureStore, Middleware } from "@reduxjs/toolkit";
import canvasReducer from "./features/canvas";
import roomReducer from "./features/room";
import gameReducer from "./features/game";
import clientReducer from "./features/client";
import { toast } from "sonner";
import { batch } from "react-redux";

const logger: Middleware = (store) => (next) => (action) => {
	console.log("dispatching", action);
	const result = next(action);
	console.log("next state", store.getState());
	return result;
};

const socketMiddleware: Middleware = (store) => {
	let socket: WebSocket | null = null;

	return (next) => (action: any) => {
		switch (action.type) {
			case "socket/connect":
				if (socket !== null) {
					socket.close();
				}

				socket = new WebSocket(action.payload);

				socket.onopen = () => toast.success("Connected to server");
				socket.onclose = (e) => {
					toast.error(e.reason ?? "Connection closed");
					// window.location.replace("/");
				};
				socket.onmessage = (event) => {
					const actions = JSON.parse(event.data);
					batch(() => {
						actions.forEach((action) => {
							if (action.type === "error") {
								toast.error(action.payload);
							} else {
								store.dispatch({
									...action,
									fromServer: true,
								});
							}
						});
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
					console.log("sending action to server", action);
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
	devTools: true,
	reducer: {
		canvas: canvasReducer,
		room: roomReducer,
		game: gameReducer,
		client: clientReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({ serializableCheck: false }).concat(
			logger,
			socketMiddleware
		),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
