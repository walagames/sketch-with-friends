import { RoomPane } from "./room-pane";

export function PreGameHostView() {
	return (
		<div className="flex h-full flex-col items-center justify-center w-full">
			<RoomPane isHost={true} />
		</div>
	);
}
