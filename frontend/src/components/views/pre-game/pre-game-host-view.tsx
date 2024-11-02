import { RoomPane } from "./room-pane";
import { SkyScene } from "@/components/scenes/sky-scene";

export function PreGameHostView() {
	return (
		<SkyScene>
			<RoomPane isHost={true} />
		</SkyScene>
	);
}
