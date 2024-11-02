import { useDispatch } from "react-redux";
import { RaisedButton } from "@/components/ui/raised-button";
import { enterRoomCode } from "@/state/features/client";
import { clearQueryParams } from "@/lib/params";
import { HillScene } from "@/components/scenes/hill-scene";
import { Logo } from "@/components/logo";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { CodeForm } from "./code-form";
import { AnimatePresence } from "framer-motion";
import { Doodle } from "@/components/doodle/doodle";

export function EnterCodeView() {
	const dispatch = useDispatch();

	return (
		<HillScene>
			<Logo />
			<div className="flex flex-col items-center gap-4 max-w-64">
				<RaisedButton
					size="xl"
					variant="action"
					className="w-full"
					onClick={() => {
						clearQueryParams();
						dispatch(enterRoomCode("new"));
					}}
				>
					Create room
				</RaisedButton>
				<CodeForm />
			</div>

			<AnimatePresence>
				<BobbingDoodle
					duration={4}
					style={{ top: "20%", left: "12%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					duration={5}
					style={{ top: "8%", left: "20%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					duration={4.5}
					style={{ top: "10%", right: "10%" }}
					src="/doodles/rain-cloud.png"
				/>
				<Doodle
					style={{ top: "28%", left: "36%", width: "7rem" }}
					src="/doodles/sparkles.png"
				/>
				<Doodle
					style={{ top: "45%", left: "34%", width: "9rem" }}
					src="/doodles/ice-cream.png"
				/>
				<Doodle
					style={{ top: "64%", right: "35%", width: "7rem" }}
					src="/doodles/gift.png"
				/>
				<Doodle
					style={{ top: "38%", right: "34%", width: "7rem" }}
					src="/doodles/hearts.png"
				/>
				<Doodle
					style={{ top: "65%", left: "33%", width: "6rem" }}
					src="/doodles/music.png"
				/>
				<Doodle
					style={{ top: "64%", left: "30%", rotate: "15deg", width: "5rem" }}
					src="/doodles/music.png"
				/>
			</AnimatePresence>

			<AirplaneDoodle
				startAt={{ left: "135%", top: "70%", rotate: 40 }}
				animateTo={{ left: "75%", top: "50%", rotate: 30 }}
				leaveTo={{ left: "135%", top: "70%", rotate: 40 }}
			/>
		</HillScene>
	);
}
