import { useSelector } from "react-redux";
import { RoomPane } from "./room-pane";
import { RoomScene } from "@/components/scenes/room-scene";
import { getRoomRole } from "@/lib/player";
import { RootState } from "@/state/store";
import { RoomRole } from "@/state/features/room";

export function PreGameView() {
	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.room.playerId);
	const role = getRoomRole(playerId, players);

	return (
		<RoomScene>
			<RoomPane isHost={role === RoomRole.Host} />
		</RoomScene>
	);
}
