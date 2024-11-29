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
import { Footer } from "@/components/footer";
import { useMemo } from "react";

interface DoodleItem {
	src: string;
	width: string;
}

interface DoodleSlot {
	initial: {
		top?: number;
		bottom?: number;
		left?: number;
		right?: number;
		rotate: number;
	};
	animate: {
		top?: number;
		bottom?: number;
		left?: number;
		right?: number;
		rotate: number;
	};
	delay: number;
}

export function EnterCodeView() {
	const dispatch = useDispatch();

	const doodleSlots: DoodleSlot[] = useMemo(
		() => [
			{
				initial: { top: 0, left: 0, rotate: 60 },
				animate: { top: -175, left: -150, rotate: 0 },
				delay: 0.1,
			},
			{
				initial: { bottom: 0, left: 0, rotate: -110 },
				animate: { bottom: 75, left: -250, rotate: 0 },
				delay: 0.15,
			},
			{
				initial: { top: 0, right: 0, rotate: 90 },
				animate: { top: -150, right: -150, rotate: 0 },
				delay: 0.05,
			},
			{
				initial: { bottom: 0, right: 0, rotate: 90 },
				animate: { bottom: -175, right: -175, rotate: 0 },
				delay: 0.25,
			},
			{
				initial: { bottom: 0, left: 0, rotate: 120 },
				animate: { bottom: -175, left: -100, rotate: 0 },
				delay: 0.2,
			},
			{
				initial: { bottom: 0, left: 0, rotate: -90 },
				animate: { bottom: -175, left: -175, rotate: 15 },
				delay: 0.2,
			},
		],
		[]
	);

	const doodles = useMemo(() => {
		const items: DoodleItem[] = [
			{ src: "/doodles/sparkles.png", width: "6rem" },
			{ src: "/doodles/ice-cream.png", width: "9rem" },
			{ src: "/doodles/gift.png", width: "6rem" },
			{ src: "/doodles/hearts.png", width: "7rem" },
			{ src: "/doodles/music.png", width: "6rem" },
		].sort(() => Math.random() - 0.5);

		const musicIndex = items.findIndex(
			(item) => item.src === "/doodles/music.png"
		);
		const musicItem = items.splice(musicIndex, 1)[0];
		items.push(musicItem);
		items.push({ ...musicItem, width: "5rem" }); // Add music item twice since we have 6 slots

		return items;
	}, []);

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
					{doodleSlots.map((slot, index) => (
						<Doodle
							key={`doodle-${index}`}
							delay={slot.delay}
							initial={{
								width: doodles[index].width,
								scale: 0,
								opacity: 0,
								...slot.initial,
							}}
							animate={{
								scale: 1,
								opacity: 1,
								...slot.animate,
							}}
							src={doodles[index].src}
						/>
					))}
				</AnimatePresence>
			</div>

			<AnimatePresence>
				<AirplaneDoodle
					delay={0}
					layoutId="airplane-enter-code"
					startAt={{ left: "50%", top: "45%", rotate: 20, opacity: 0 }}
					animateTo={{ left: "65%", top: "45%", rotate: 20, opacity: 1 }}
					leaveTo={{ left: "135%", top: "70%", rotate: 40, opacity: 0 }}
				/>
				<BobbingDoodle
					key="rain-cloud-1"
					hideOnSmallViewports
					duration={4}
					className="lg:top-[20%] top-[6%] lg:left-[12%] left-[6%] absolute w-32"
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

			<Footer />
		</HillScene>
	);
}
