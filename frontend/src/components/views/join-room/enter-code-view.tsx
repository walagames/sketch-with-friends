import { useDispatch } from "react-redux";
import { RaisedButton } from "@/components/ui/raised-button";
import { enterRoomCode } from "@/state/features/client";
import { clearQueryParams } from "@/lib/params";
import { HillScene } from "@/components/scenes/hill-scene";
import { Logo } from "@/components/logo";
import { AirplaneDoodle } from "@/components/doodle/airplane-doodle";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { CodeForm } from "./code-form";
import { AnimatePresence, motion } from "framer-motion";
import { Doodle } from "@/components/doodle/doodle";
import { Footer } from "@/components/footer";

export function EnterCodeView() {
	const dispatch = useDispatch();

	return (
		<HillScene>
			<div className="flex flex-col items-center gap-4 max-w-64 relative z-50">
				<Logo />
				<div className="flex flex-col items-center gap-2 max-w-64 py-2">
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
					<div className="flex items-center gap-2 w-full px-1 -translate-y-0.5">
						<div className="h-0.5 bg-primary/50 flex-1 rounded-full" />
						<p className="text-sm text-muted-foreground font-semibold">or</p>
						<div className="h-0.5 bg-primary/50 flex-1 rounded-full" />
					</div>
					<CodeForm />
				</div>
				<AnimatePresence>
					<Doodle
						initial={{
							width: "6rem",
							scale: 0,
							top: 0,
							left: 0,
							opacity: 0,
							rotate: 60,
						}}
						animate={{
							top: "-57%",
							left: "-57%",
							scale: 1,
							opacity: 1,
							rotate: 0,
						}}
						src="/doodles/sparkles.png"
					/>
					<Doodle
						initial={{
							width: "9rem",
							bottom: 0,
							left: 0,
							scale: 0,
							opacity: 0,
							rotate: -110,
						}}
						animate={{
							bottom: "16%",
							left: "-120%",
							scale: 1,
							opacity: 1,
							rotate: 0,
						}}
						src="/doodles/ice-cream.png"
					/>
					<Doodle
						initial={{
							top: 0,
							right: 0,
							width: "6rem",
							scale: 0,
							opacity: 0,
							rotate: 90,
						}}
						animate={{
							top: "-50%",
							right: "-55%",
							scale: 1,
							opacity: 1,
							rotate: 0,
						}}
						src="/doodles/gift.png"
					/>
					<Doodle
						initial={{
							bottom: 0,
							right: 0,
							width: "7rem",
							scale: 0,
							opacity: 0,
							rotate: 120,
						}}
						animate={{
							bottom: "-65%",
							right: "-65%",
							scale: 1,
							opacity: 1,
							rotate: 0,
						}}
						src="/doodles/hearts.png"
					/>
					<Doodle
						initial={{
							bottom: 0,
							left: 0,
							width: "6rem",
							scale: 0,
							opacity: 0,
							rotate: 120,
						}}
						animate={{
							bottom: "-65%",
							left: "-35%",
							scale: 1,
							opacity: 1,
							rotate: 0,
						}}
						src="/doodles/music.png"
					/>
					<Doodle
						initial={{
							bottom: 0,
							left: 0,
							width: "5rem",
							scale: 0,
							opacity: 0,
							rotate: -90,
						}}
						animate={{
							bottom: "-70%",
							left: "-65%",
							rotate: 15,
							scale: 1,
							opacity: 1,
						}}
						src="/doodles/music.png"
					/>
				</AnimatePresence>
			</div>

			<AnimatePresence>
				<BobbingDoodle
					key="rain-cloud-1"
					hideOnSmallViewports
					duration={4}
					className="lg:top-[20%] top-[10%] lg:left-[12%] left-[6%] absolute w-32"
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					key="rain-cloud-2"
					hideOnSmallViewports
					duration={4}
					className="lg:hidden bottom-[10%] right-[14%] absolute h-28"
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					key="rain-cloud-3"
					hideOnSmallViewports
					duration={5}
					style={{ top: "8%", left: "20%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					key="rain-cloud-4"
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

			<Footer />
		</HillScene>
	);
}
