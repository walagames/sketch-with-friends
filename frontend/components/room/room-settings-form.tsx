"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useRoomContext } from "./room-provider";
import { RoomEventType } from "@/types/room";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useDebouncedCallback } from "use-debounce";

const RoomFormSchema = z.object({
	drawingTime: z.number().min(15).max(180),
	rounds: z.number().min(2).max(10),
	isRoomOpen: z.boolean(),
});

export function RoomSettingsForm() {
	const { handleEvent } = useRoomContext();

	const form = useForm<z.infer<typeof RoomFormSchema>>({
		resolver: zodResolver(RoomFormSchema),
		defaultValues: {
			drawingTime: 60,
			rounds: 5,
			isRoomOpen: true,
		},
	});

	const handleChange = useDebouncedCallback(() => {
		// ! is this safe?
		handleEvent({
			type: RoomEventType.CHANGE_SETTINGS,
			payload: form.getValues(),
		});
	}, 300);

	function handleSubmit(data: z.infer<typeof RoomFormSchema>) {
		handleEvent({
			type: RoomEventType.START_GAME,
		});
	}

	return (
		<div className="max-w-md w-full flex flex-col gap-4">
			<h1 className="text-3xl font-medium tracking-tight">Game settings</h1>
			<Form {...form}>
				<form
					onChange={handleChange}
					onSubmit={form.handleSubmit(handleSubmit)}
					className="space-y-6"
				>
					
					<div className="space-y-4"><FormField
						control={form.control}
						name="isRoomOpen"
						render={({ field }) => (
							<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
								<div className="space-y-0.5">
									<FormLabel className="text-base">Open Room</FormLabel>
									<FormDescription>
										Allow players to join after the game starts
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
