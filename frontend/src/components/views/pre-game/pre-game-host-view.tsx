import { RoomPane } from "./room-pane";
import { RoomScene } from "@/components/scenes/room-scene";

export function PreGameHostView() {
	return (
		<RoomScene>
			<RoomPane isHost />
		</RoomScene>
	);
}
