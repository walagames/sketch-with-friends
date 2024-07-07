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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function JoinRoomCard() {
	return (
		<Card className="w-96">
			<CardHeader>
				<CardTitle>Create room</CardTitle>
				<CardDescription>Create a new room to start drawing.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2">
				<CreateRoomForm />
			</CardContent>
		</Card>
	);
}

const CreateRoomFormSchema = z.object({
	username: z.string().min(2, {
		message: "Username must be at least 2 characters.",
	}),
});

export function CreateRoomForm() {
	const { createRoom, joinRoom } = useRoomContext();
	const form = useForm<z.infer<typeof CreateRoomFormSchema>>({
		resolver: zodResolver(CreateRoomFormSchema),
		defaultValues: {
			username: "",
		},
	});

	function onCreateSubmit(data: z.infer<typeof CreateRoomFormSchema>) {
		createRoom();
	}

	function onJoinSubmit(data: z.infer<typeof CreateRoomFormSchema>) {
		joinRoom(data.username);
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => {
					// This is hacky, but it works for now
					e.preventDefault();
					const submitType = (e.nativeEvent as any).submitter?.getAttribute("data-submit-type");
					if (submitType === "join") {
						form.handleSubmit(onJoinSubmit)(e);
					} else {
						form.handleSubmit(onCreateSubmit)(e);
					}
				}}
				className="space-y-6"
			>
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
					<Button className="w-full" type="submit" data-submit-type="join">
						Join
					</Button>
					<Button className="w-full" type="submit" data-submit-type="create">
						Create
					</Button>
				</div>
			</form>
		</Form>
	);
}
