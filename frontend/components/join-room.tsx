"use client"
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
		<Tabs defaultValue="join" className="w-[400px]">
			<TabsList className="grid w-full grid-cols-2">
				<TabsTrigger value="create">Create room</TabsTrigger>
				<TabsTrigger value="join">Join room</TabsTrigger>
			</TabsList>
			<TabsContent value="create">
				<Card>
					<CardHeader>
						<CardTitle>Create room</CardTitle>
						<CardDescription>
							Create a new room to start drawing.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						<CreateRoomForm />
					</CardContent>
				</Card>
			</TabsContent>
			<TabsContent value="join">
				<Card>
					<CardHeader>
						<CardTitle>Join room</CardTitle>
						<CardDescription>
							Join an existing room to start drawing.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						<JoinRoomForm />
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	);
}

const JoinRoomFormSchema = z.object({
	username: z.string().min(2, {
		message: "Username must be at least 2 characters.",
	}),
	code: z.string().length(4, {
		message: "Room code must be 4 characters.",
	}),
});

export function JoinRoomForm() {
	const { joinRoom } = useRoomContext();
	const form = useForm<z.infer<typeof JoinRoomFormSchema>>({
		resolver: zodResolver(JoinRoomFormSchema),
		defaultValues: {
			username: "",
			code: "",
		},
	});

	function onSubmit(data: z.infer<typeof JoinRoomFormSchema>) {
		joinRoom(data.code);
		// toast(
		// 	<pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
		// 		<code className="text-white">{JSON.stringify(data, null, 2)}</code>
		// 	</pre>
		// );
	}

	return (
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
					<FormField
						control={form.control}
						name="code"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Room code</FormLabel>
								<FormControl>
									<Input placeholder="Enter the room code" {...field} />
								</FormControl>

								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<Button className="w-full" type="submit">
					Join
				</Button>
			</form>
		</Form>
	);
}

const CreateRoomFormSchema = z.object({
	username: z.string().min(2, {
		message: "Username must be at least 2 characters.",
	}),
});

export function CreateRoomForm() {
	const { createRoom } = useRoomContext();
	const form = useForm<z.infer<typeof CreateRoomFormSchema>>({
		resolver: zodResolver(CreateRoomFormSchema),
		defaultValues: {
			username: "",
		},
	});

	function onSubmit(data: z.infer<typeof CreateRoomFormSchema>) {
		createRoom(data.username);
	}

	return (
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
				<Button className="w-full" type="submit">
					Create
				</Button>
			</form>
		</Form>
	);
}
