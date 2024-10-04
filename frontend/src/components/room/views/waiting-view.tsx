import { PlayerRole } from "@/types/player";
import { getPlayerRole } from "@/lib/player";
import { motion } from "framer-motion";
import { GameStartCountdown } from "../game-start-countdown";
import { RoomStatus } from "@/types/room";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { RoomEventType } from "@/types/room";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormDescription,
} from "@/components/ui/form";
import { useRoomContext } from "../../../contexts/room-context";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useDebouncedCallback } from "use-debounce";

const waitingViews = {
	[PlayerRole.HOST]: {
		Component: HostView,
	},
	[PlayerRole.PLAYER]: {
		Component: PlayerView,
	},
};

function HostView() {
	return (
		<div className="flex-1 h-full w-full flex flex-col items-center justify-center relative">
			<RoomSettingsForm />
		</div>
	);
}

function PlayerView() {
	return (
		<div className="flex-1 flex flex-col items-center justify-center relative">
			<p
				style={{ wordSpacing: "0.01em" }}
				className="text-4xl font-medium tracking-tight"
			>
				Waiting for the host to start the game
			</p>
		</div>
	);
}

export function WaitingView() {
	const { room, playerId } = useRoomContext();

	const role = getPlayerRole(playerId, room.players);
	const WaitingView = waitingViews[role as keyof typeof waitingViews];

	return (
		<motion.div
			key="waiting"
			initial={{ opacity: 0, scale: 1 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 1 }}
			transition={{
				type: "spring",
				stiffness: 500,
				damping: 50,
				mass: 1,
			}}
			className="h-full w-full flex flex-col z-10 p-3 absolute inset-0"
		>
			{room.status === RoomStatus.WAITING && <WaitingView.Component />}

			{(room.game?.startsAt || room.status === RoomStatus.PLAYING) && (
				<GameStartCountdown />
			)}
		</motion.div>
	);
}

const RoomFormSchema = z.object({
	drawingTime: z.number().min(15).max(180),
	rounds: z.number().min(2).max(10),
	isRoomOpen: z.boolean(),
	playerLimit: z.number().min(2).max(10),
});

export function RoomSettingsForm() {
	const { handleEvent, room } = useRoomContext();

	const form = useForm<z.infer<typeof RoomFormSchema>>({
		resolver: zodResolver(RoomFormSchema),
		defaultValues: {
			drawingTime: room.settings.drawingTime,
			rounds: room.settings.rounds,
			isRoomOpen: room.settings.isRoomOpen,
			playerLimit: room.settings.playerLimit,
		},
	});

	const handleChange = useDebouncedCallback(() => {
		// ! is this safe?
		const values = form.getValues();
		console.log(values);
		handleEvent({
			type: RoomEventType.CHANGE_SETTINGS,
			payload: values,
		});
	}, 300);

	function handleSubmit(data: z.infer<typeof RoomFormSchema>) {
		console.log(data);
		if (room.players.length >= 2) {
			handleEvent({
				type: RoomEventType.START_GAME,
			});
		} else {
			toast.info("At least 2 players required");
		}
	}

	return (
		<div className="max-w-md w-full flex flex-col gap-4">
			<h1 className="text-3xl font-medium tracking-tight">Room settings</h1>
			<Form {...form}>
				<form
					onChange={handleChange}
					onSubmit={form.handleSubmit(handleSubmit)}
					className="space-y-6"
				>
					<div className="space-y-4">
						<FormField
							control={form.control}
							name="isRoomOpen"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">Open Room</FormLabel>
										<FormDescription>
											Allow uninvited players to join the room
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="playerLimit"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Player Limit</FormLabel>
									<FormControl>
										<Slider
											min={2}
											max={10}
											step={1}
											defaultValue={[field.value]}
											onValueChange={(vals) => {
												field.onChange(vals[0]);
											}}
										/>
									</FormControl>
									<FormDescription>{field.value} players</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="drawingTime"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Drawing Time</FormLabel>
									<FormControl>
										<Slider
											min={15}
											max={180}
											step={5}
											defaultValue={[field.value]}
											onValueChange={(vals) => {
												field.onChange(vals[0]);
											}}
										/>
									</FormControl>
									<FormDescription>{field.value} seconds</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="rounds"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Number of Rounds</FormLabel>
									<FormControl>
										<Slider
											min={2}
											max={10}
											step={1}
											defaultValue={[field.value]}
											onValueChange={(vals) => {
												field.onChange(vals[0]);
											}}
										/>
									</FormControl>
									<FormDescription>{field.value} rounds</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex flex-col gap-2 py-2">
							<Button className="w-full" type="submit">
								Start game
							</Button>
						</div>
					</div>
				</form>
			</Form>
		</div>
	);
}
