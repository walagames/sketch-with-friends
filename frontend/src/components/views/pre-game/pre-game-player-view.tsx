import { RoomPane } from "./room-pane";
import { SkyScene } from "@/components/scenes/sky-scene";

export function PreGamePlayerView() {
	return (
		<SkyScene>
			<RoomPane isHost={false} />
		</SkyScene>
	);
}
