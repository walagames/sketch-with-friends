import { RoomPane } from "./room-pane";
import { RoomScene } from "@/components/scenes/room-scene";

export function PreGamePlayerView() {
	return (
		<RoomScene>
			<RoomPane />
		</RoomScene>
	);
}
