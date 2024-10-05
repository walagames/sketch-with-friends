import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { RoomProvider } from "./contexts/room-context";
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<RoomProvider>
			<App />
		</RoomProvider>
	</StrictMode>
);
