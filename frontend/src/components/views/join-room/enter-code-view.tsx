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
// import { Doodle } from "@/components/doodle/doodle";

export function EnterCodeView() {
	const dispatch = useDispatch();

	return (
		<HillScene>
			<div className="flex flex-col items-center gap-4 max-w-64 relative">
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
				{/* <Doodle
					style={{ top: "-57%", left: "-25%", width: "6rem" }}
					src="/doodles/sparkles.png"
				/>
				<Doodle
					style={{ bottom: "10%", left: "-75%", width: "8rem" }}
					src="/doodles/ice-cream.png"
				/>
				<Doodle
					style={{ top: "-50%", right: "-35%", width: "6rem" }}
					src="/doodles/gift.png"
				/>
				<Doodle
					style={{ bottom: "-65%", right: "-30%", width: "7rem" }}
					src="/doodles/hearts.png"
				/>
				<Doodle
					style={{ bottom: "-65%", left: "-20%", width: "6rem" }}
					src="/doodles/music.png"
				/>
				<Doodle
					style={{
						bottom: "-70%",
						left: "-45%",
						rotate: "15deg",
						width: "5rem",
					}}
					src="/doodles/music.png"
				/> */}
			</div>

			<AnimatePresence>
				<BobbingDoodle
					key="rain-cloud-1"
					hideOnSmallViewports
					duration={4}
					className="lg:top-[20%] top-[4%] lg:left-[12%] left-[32%] absolute h-32"
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					key="rain-cloud-2"
					hideOnSmallViewports
					duration={5}
					style={{ top: "8%", left: "20%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					key="rain-cloud-3"
					hideOnSmallViewports
					duration={4.5}
					style={{ top: "10%", right: "10%" }}
					src="/doodles/rain-cloud.png"
				/>
			</AnimatePresence>

			<AirplaneDoodle
				layoutId="airplane-enter-code"
				startAt={{ left: "135%", top: "70%", rotate: 20 }}
				animateTo={{ left: "75%", top: "45%", rotate: 20 }}
				leaveTo={{ left: "135%", top: "70%", rotate: 40 }}
			/>
		</HillScene>
	);
}
