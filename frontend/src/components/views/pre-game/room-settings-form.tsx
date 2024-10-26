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
import { changeRoomSettings, WordDifficulty } from "@/state/features/room";
import { RootState } from "@/state/store";
import { useDispatch } from "react-redux";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const RoomFormSchema = z.object({
	drawingTimeAllowed: z.number().min(15).max(180),
	totalRounds: z.number().min(2).max(10),
	playerLimit: z.number().min(2).max(10),
	wordDifficulty: z.nativeEnum(WordDifficulty),
});

export function RoomSettingsForm() {
	const dispatch = useDispatch();
	const { playerLimit, drawingTimeAllowed, totalRounds, wordDifficulty } =
		useSelector((state: RootState) => state.room.settings);

	const form = useForm<z.infer<typeof RoomFormSchema>>({
		resolver: zodResolver(RoomFormSchema),
		defaultValues: {
			drawingTimeAllowed,
			totalRounds,
			playerLimit,
			wordDifficulty,
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
						name="wordDifficulty"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Word Difficulty</FormLabel>
								<FormControl>
									<Select
										defaultValue={field.value}
										onValueChange={field.onChange}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select a difficulty" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value={WordDifficulty.Easy}>Easy</SelectItem>
											<SelectItem value={WordDifficulty.Medium}>
												Medium
											</SelectItem>
											<SelectItem value={WordDifficulty.Hard}>Hard</SelectItem>
											<SelectItem value={WordDifficulty.Random}>
												Random
											</SelectItem>
										</SelectContent>
									</Select>
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
						name="drawingTimeAllowed"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Drawing Time</FormLabel>
								<FormControl>
									<Slider
										min={15}
										max={90}
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
										min={1}
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
