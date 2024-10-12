import { PlayerCards } from "@/components/player-card";
import { useDispatch } from "react-redux";
import { copyRoomLink } from "@/lib/realtime";
import { RaisedButton } from "@/components/raised-button";
import { useState } from "react";
import { ClockIcon, SettingsIcon, Tally5Icon, UsersIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormDescription,
} from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { useDebouncedCallback } from "use-debounce";
import { useSelector } from "react-redux";
import { changeRoomSettings } from "@/state/features/room";
import { RootState } from "@/state/store";

export function RoomPane({ isHost }: { isHost: boolean }) {
	const players = useSelector((state: RootState) => state.room.players);
	const roomId = useSelector((state: RootState) => state.room.id);

	const [showSettings, setShowSettings] = useState(false);

	const settings = useSelector((state: RootState) => state.room.settings);

	const dispatch = useDispatch();
	return (
		<div className="max-w-3xl w-full flex flex-col items-end gap-4">
			<div className="flex gap-6 items-center w-full">
				<RaisedButton size="lg" onClick={() => copyRoomLink(roomId)}>
					{roomId}
				</RaisedButton>
				<span className="font-bold text-xl flex items-center gap-2">
					<UsersIcon className="w-5 h-5 mb-1" />
					{Object.keys(players).length}/{settings.playerLimit}
				</span>
				<span className="font-bold text-xl flex items-center gap-2">
					<Tally5Icon className="w-5 h-5 mb-1" />
					{settings.totalRounds}
				</span>
				<span className="font-bold text-xl flex items-center gap-1.5">
					<ClockIcon className="w-5 h-5 mb-1" />
					{settings.drawingTimeAllowed}s
				</span>
				{isHost && (
					<div className="ml-auto">
						<RaisedButton
							variant="action"
							size="icon"
							onClick={() => setShowSettings(!showSettings)}
						>
							{showSettings ? <UsersIcon /> : <SettingsIcon />}
						</RaisedButton>
					</div>
				)}
			</div>
			<div className="w-full aspect-[4/3] bg-zinc-400/10 border-4 border-border border-dashed rounded-lg flex items-start justify-center py-8 px-6">
				{showSettings ? (
					<RoomSettingsForm />
				) : (
					<PlayerCards players={Object.values(players)} />
				)}
			</div>
			{isHost && (
				<RaisedButton
					size="xl"
					variant="action"
					onClick={() => dispatch({ type: "game/startGame" })}
				>
					Start game
				</RaisedButton>
			)}
		</div>
	);
}

const RoomFormSchema = z.object({
	drawingTimeAllowed: z.number().min(15).max(180),
	totalRounds: z.number().min(2).max(10),
	playerLimit: z.number().min(2).max(10),
});

export function RoomSettingsForm() {
	const dispatch = useDispatch();
	const { playerLimit, drawingTimeAllowed, totalRounds } = useSelector(
		(state: RootState) => state.room.settings
	);

	const form = useForm<z.infer<typeof RoomFormSchema>>({
		resolver: zodResolver(RoomFormSchema),
		defaultValues: {
			drawingTimeAllowed,
			totalRounds,
			playerLimit,
		},
	});

	const handleChange = useDebouncedCallback(() => {
		const values = form.getValues();
		dispatch(changeRoomSettings(values));
	}, 300);

	return (
		<div className="max-w-sm w-full flex flex-col gap-4 my-auto">
			<h1 className="text-3xl font-bold">Room settings</h1>
			<Form {...form}>
				<form onChange={handleChange} className="space-y-6">
					{/* <FormField
							control={form.control} 
							name="isPrivate"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">Private Room</FormLabel>
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
						/> */}
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
						name="drawingTimeAllowed"
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
						name="totalRounds"
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
				</form>
			</Form>
		</div>
	);
}
