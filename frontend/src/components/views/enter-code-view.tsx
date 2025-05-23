import { useDispatch } from "react-redux";
import { RaisedButton } from "@/components/ui/raised-button";
import { enterRoomCode } from "@/state/features/client";
import { clearQueryParams } from "@/lib/params";
import { SkyScene } from "@/components/scenes/sky-scene";
import { Logo } from "@/components/ui/logo";
import { CodeForm } from "./components/code-form";
import { AnimatePresence } from "motion/react";
import { Doodle } from "@/components/doodle/doodle";
import { useMemo } from "react";
import { setCurrentState, RoomState } from "@/state/features/room";

interface DoodleItem {
	src: string;
	width: string;
}

interface DoodleSlot {
	id: string;
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
				id: "top-right",
				initial: { top: 0, right: 0, rotate: 90 },
				animate: { top: -150, right: -175, rotate: 0 },
				delay: 0.1,
			},
			{
				id: "top-left",
				initial: { top: 0, left: 0, rotate: 60 },
				animate: { top: -175, left: -175, rotate: 0 },
				delay: 0.2,
			},
			{
				id: "middle-left",
				initial: { bottom: 0, left: 0, rotate: -110 },
				animate: { bottom: 65, left: -275, rotate: 0 },
				delay: 0.275,
			},
			{
				id: "bottom-right",
				initial: { bottom: 0, right: 0, rotate: 90 },
				animate: { bottom: -175, right: -175, rotate: 0 },
				delay: 0.4,
			},
			{
				id: "bottom-left-1",
				initial: { bottom: 0, left: 0, rotate: 120 },
				animate: { bottom: -175, left: -100, rotate: 0 },
				delay: 0.325,
			},
			{
				id: "bottom-left-2",
				initial: { bottom: 0, left: 0, rotate: -90 },
				animate: { bottom: -175, left: -175, rotate: 15 },
				delay: 0.325,
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
			{ src: "/doodles/happy-cup.png", width: "6rem" },
			{ src: "/doodles/flag.png", width: "6rem" },
		]
			.sort(() => Math.random() - 0.5)
			.slice(0, 5);

		items.splice(
			4,
			0,
			{
				src: "/doodles/music.png",
				width: "6rem",
			},
			{ src: "/doodles/music.png", width: "5rem" }
		);

		return items;
	}, []);

	return (
		<SkyScene className="h-[100dvh]">
			<AnimatePresence>
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
								dispatch(setCurrentState(RoomState.EnterPlayerInfo));
							}}
						>
							Create room
						</RaisedButton>
						<div className="flex items-center gap-2 w-full px-1 -translate-y-0.5">
							<div className="h-0.5 bg-foreground/20 flex-1 rounded-full" />
							<p className="text-sm text-muted-foreground font-semibold">or</p>
							<div className="h-0.5 bg-foreground/20 flex-1 rounded-full" />
						</div>
						<CodeForm />
					</div>

					{doodleSlots.map((slot, index) => (
						<Doodle
							key={slot.id}
							delay={slot.delay}
							initial={{
								width: doodles[index].width,
								scale: 1,
								opacity: 1,
								...slot.animate,
							}}
							src={doodles[index].src}
						/>
					))}
				</div>
			</AnimatePresence>
		</SkyScene>
	);
}
