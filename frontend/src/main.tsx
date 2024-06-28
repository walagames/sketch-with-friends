import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { RoomProvider } from "@/components/room-provider.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<RoomProvider>
			<App />
		</RoomProvider>
	</React.StrictMode>
);
