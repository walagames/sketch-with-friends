import { SkyScene } from "@/components/scenes/sky-scene";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { PlayerInfoForm } from "./components/player-info-form";
import { AnimatePresence } from "framer-motion";
import { getRealtimeHref } from "@/lib/realtime";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { enterRoomCode } from "@/state/features/client";
import { StepBackIcon, StepForwardIcon } from "lucide-react";
import { RaisedButton } from "@/components/ui/raised-button";
import { RoomState, setCurrentState } from "@/state/features/room";
import { useEffect, useState } from "react";

export function EnterPlayerInfoView() {
	const dispatch = useDispatch();
	const roomState = useSelector((state: RootState) => state.room.currentState);

	const [isJoining, setIsJoining] = useState(false);

	const enteredRoomCode = useSelector(
		(state: RootState) => state.client.roomCode
	);

	useEffect(() => {
		setIsJoining(false);
	}, [roomState]);

	function handleSubmit() {
		setIsJoining(true);
		if (enteredRoomCode && enteredRoomCode !== "new") {
			dispatch({
				type: "socket/connect",
				payload: getRealtimeHref() + "/join/" + enteredRoomCode,
			});
		} else {
			dispatch({
				type: "socket/connect",
				payload: getRealtimeHref() + "/host",
			});
		}
	}

	function handleBack() {
		dispatch(enterRoomCode(""));
		dispatch(setCurrentState(RoomState.EnterCode));
	}

	return (
		<SkyScene>
			<PlayerInfoForm
				handleSubmit={handleSubmit}
				leftButton={
					<RaisedButton
						onClick={handleBack}
						type="button"
						shift={false}
						variant="action"
						size="icon"
					>
						<StepBackIcon className="w-6 h-6" />
					</RaisedButton>
				}
				rightButton={
					<RaisedButton
						disabled={isJoining}
						shift={false}
						variant="action"
						size="icon"
					>
						{isJoining ? (
							<span className="loader h-5 w-5 mt-1.5" />
						) : (
							<StepForwardIcon className="w-6 h-6" />
						)}
					</RaisedButton>
				}
			/>
			<AnimatePresence>
				<BobbingDoodle
					key="rain-cloud-1"
					duration={6}
					style={{ top: "5%", left: "12%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					key="rain-cloud-2"
					hideOnSmallViewports
					duration={4}
					style={{ top: "24%", right: "10%" }}
					src="/doodles/rain-cloud.png"
				/>
			</AnimatePresence>
		</SkyScene>
	);
}
