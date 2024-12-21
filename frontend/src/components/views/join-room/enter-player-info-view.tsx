import { SkyScene } from "@/components/scenes/sky-scene";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { PlayerInfoForm } from "./player-info-form";
import { AnimatePresence } from "framer-motion";
import { getRealtimeHref } from "@/lib/realtime";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { PlayerProfile, RoomStage } from "@/state/features/room";
import { enterRoomCode, setIsJoining } from "@/state/features/client";
import { StepBackIcon, StepForwardIcon } from "lucide-react";
import { RaisedButton } from "@/components/ui/raised-button";

export function EnterPlayerInfoView() {
	const roomStage = useSelector((state: RootState) => state.room.stage);
	const dispatch = useDispatch();
	const isJoining = useSelector((state: RootState) => state.client.isJoining);

	const exitPosition = () => {
		switch (roomStage) {
			case RoomStage.PreGame:
				return { left: "80%", top: "-20%", rotate: -5 };
			default:
				return { opacity: 0, left: "5%", top: "55%", rotate: 20 };
		}
	};

	const enteredRoomCode = useSelector(
		(state: RootState) => state.client.enteredRoomCode
	);

	function handleSubmit(profile: PlayerProfile) {
		const { name, avatarSeed, avatarColor } = profile;

		dispatch(setIsJoining(true));

		if (enteredRoomCode && enteredRoomCode !== "new") {
			dispatch({
				type: "socket/connect",
				payload:
					getRealtimeHref() +
					"/join/" +
					enteredRoomCode +
					"?username=" +
					name +
					"&avatarSeed=" +
					avatarSeed +
					"&avatarColor=" +
					avatarColor,
			});
		} else {
			dispatch({
				type: "socket/connect",
				payload:
					getRealtimeHref() +
					"/host?username=" +
					name +
					"&avatarSeed=" +
					avatarSeed +
					"&avatarColor=" +
					avatarColor,
			});
		}
	}

	return (
		<SkyScene>
			<PlayerInfoForm
				handleSubmit={handleSubmit}
				leftButton={
					<RaisedButton
						onClick={() => dispatch(enterRoomCode(""))}
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
			<AirplaneDoodle
				startAt={{ left: "-15%", top: "50%", rotate: 25, opacity: 0 }}
				animateTo={{ left: "25%", top: "60%", rotate: 35, opacity: 1 }}
				leaveTo={exitPosition()}
				skipTransition
			/>
		</SkyScene>
	);
}
