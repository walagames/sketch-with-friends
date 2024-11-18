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
import {
	changeRoomSettings,
	GameMode,
	WordBank,
	WordDifficulty,
} from "@/state/features/room";
import { RootState } from "@/state/store";
import { useDispatch } from "react-redux";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BrainIcon, ClockIcon, Tally5Icon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";

const RoomFormSchema = z.object({
	drawingTimeAllowed: z.number().min(15).max(180),
	totalRounds: z.number().min(2).max(10),
	playerLimit: z.number().min(2).max(10),
	wordDifficulty: z.nativeEnum(WordDifficulty),
	wordBank: z.nativeEnum(WordBank),
	gameMode: z.nativeEnum(GameMode),
	customWords: z.string(),
});

export function RoomSettingsForm() {
	const dispatch = useDispatch();
	const {
		playerLimit,
		drawingTimeAllowed,
		totalRounds,
		wordDifficulty,
		wordBank,
		gameMode,
		customWords,
	} = useSelector((state: RootState) => state.room.settings);

	const [isEditing, setIsEditing] = useState(false);

	const form = useForm<z.infer<typeof RoomFormSchema>>({
		resolver: zodResolver(RoomFormSchema),
		defaultValues: {
			drawingTimeAllowed,
			totalRounds,
			playerLimit,
			wordDifficulty,
			wordBank,
			gameMode,
			customWords: customWords.join(","),
		},
	});

	useEffect(() => {
		if (!isEditing) {
			form.setValue("customWords", customWords.join(","));
		}
	}, [customWords, isEditing]);

	const handleChange = useDebouncedCallback(() => {
		const values = form.getValues();
		const customWords = values.customWords.split(",");
		dispatch(changeRoomSettings({ ...values, customWords }));
	}, 300);

	return (
		<div className=" w-full flex flex-col lg:gap-4 gap-1">
			<h1 className="lg:text-3xl text-2xl font-bold">Room settings</h1>
			<Form {...form}>
				<form
					onChange={handleChange}
					className="flex flex-col w-full gap-4 justify-between"
				>
					<div className="flex lg:gap-8 gap-4 w-full">
						<div className="flex flex-col gap-4 w-full order-2">
							<FormField
								control={form.control}
								name="playerLimit"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-1">
											<UsersIcon className="size-4 mr-1" />
											Player Limit
										</FormLabel>
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
										<FormLabel className="flex items-center gap-1">
											<ClockIcon className="size-4 mr-1" />
											Drawing Time
										</FormLabel>
										<FormControl>
											<Slider
												min={15}
												max={9000}
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
										<FormLabel className="flex items-center gap-1">
											<Tally5Icon className="size-4 mr-1" />
											Number of Rounds
										</FormLabel>
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
						</div>

						<div className="flex flex-col gap-4 w-full">
							<FormField
								control={form.control}
								name="gameMode"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-1">
											<BrainIcon className="size-4 mr-1" />
											Game Mode
										</FormLabel>
										<FormControl>
											<Select
												defaultValue={field.value}
												onValueChange={(val: string) =>
													field.onChange(val as GameMode)
												}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select a difficulty" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value={GameMode.Classic}>
														Classic
													</SelectItem>
													<SelectItem value={GameMode.NoHints}>
														No Hints
													</SelectItem>
												</SelectContent>
											</Select>
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="wordDifficulty"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-1">
											<BrainIcon className="size-4 mr-1" />
											Word Difficulty
										</FormLabel>
										<FormControl>
											<Select
												defaultValue={field.value}
												onValueChange={(val: string) =>
													field.onChange(val as WordDifficulty)
												}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select a difficulty" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value={WordDifficulty.Easy}>
														Easy
													</SelectItem>
													<SelectItem value={WordDifficulty.Medium}>
														Medium
													</SelectItem>
													<SelectItem value={WordDifficulty.Hard}>
														Hard
													</SelectItem>
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
								name="wordBank"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Word Bank</FormLabel>
										<FormControl>
											<Select
												defaultValue={field.value}
												onValueChange={(val: string) =>
													field.onChange(val as WordBank)
												}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select a source" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value={WordBank.Default}>
														Default
													</SelectItem>
													<SelectItem value={WordBank.Custom}>
														Custom
													</SelectItem>
													<SelectItem value={WordBank.Mixed}>Mixed</SelectItem>
												</SelectContent>
											</Select>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>
					</div>
					<FormField
						control={form.control}
						name="customWords"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Custom Words</FormLabel>
								<FormControl>
									<Textarea 
										rows={5} 
										{...field} 
										spellCheck={false}
										onFocus={() => setIsEditing(true)}
										onBlur={() => setIsEditing(false)}
									/>
								</FormControl>
								<FormDescription>
									Enter custom words separated by commas
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</form>
			</Form>
		</div>
	);
}
