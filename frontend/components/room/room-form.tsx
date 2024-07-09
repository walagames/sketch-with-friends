"use client";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
} from "@/components/ui/form";
import { useRoomContext } from "./room-provider";

const RoomFormSchema = z.object({
	username: z.string().min(2, {
		message: "Username must be at least 2 characters.",
	}),
});

export function RoomForm() {
	const { handleRoomFormSubmit } = useRoomContext();
	
	const form = useForm<z.infer<typeof RoomFormSchema>>({
		resolver: zodResolver(RoomFormSchema),
		defaultValues: {
			username: "",
		},
	});

	function onSubmit(data: z.infer<typeof RoomFormSchema>) {
		handleRoomFormSubmit(data.username);
	}

	return (
		<Card className="w-96">
			<CardHeader>
				<CardTitle>Join room</CardTitle>
				<CardDescription>Join a room to start drawing.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<div className="space-y-2">
							<FormField
								control={form.control}
								name="username"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input placeholder="Enter a name" {...field} />
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Button className="w-full" type="submit">
								Play
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
