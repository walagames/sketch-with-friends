import { RoomPane } from "./room-pane";

export function PreGamePlayerView() {
	return (
		<div className="flex h-full flex-col items-center justify-center w-full">
			<RoomPane isHost={false} />
		</div>
	);
}
