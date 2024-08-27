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
import { generateAvatar } from "@/lib/avatar";
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
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
const RoomFormSchema = z.object({
	username: z.string().min(2, {
		message: "Username must be at least 2 characters.",
	}),
});
const colors = [
	"b6e3f4",
	"c0aede",
	"d1d4f9",
	"ffd5dc",
	"ffcab8",
	"f1e0b0",
	"e1f7d5",
	"c9f2e5",
	"a3e4d7",
	"aed6f1",
	"d2b4de",
	"f5cba7",
	"f9e79f",
	"abebc6",
	"d5f5e3",
	"fadbd8",
	"f5b7b1",
	"d6eaf8",
	"ebdef0",
	"f4ecf7",
	"d6dbdf",
	"eaeded",
	"f2f3f4",
];

export function RoomJoinForm() {
	const { handleRoomFormSubmit } = useRoomContext();

	const [avatarSeed, setAvatarSeed] = useState(generateRandomHash());
	const [avatarSvg, setAvatarSvg] = useState("");
	const [color, setColor] = useState(randomColor());

	const form = useForm<z.infer<typeof RoomFormSchema>>({
		resolver: zodResolver(RoomFormSchema),
		defaultValues: {
			username: "",
		},
	});

	useEffect(() => {
		setAvatarSvg(generateAvatar(avatarSeed, color));
	}, [avatarSeed, color]);



	function randomColor() {
		return colors[Math.floor(Math.random() * colors.length)];
	}

	function generateNewAvatarSeed() {
		const newSeed = generateRandomHash();
		setAvatarSeed(newSeed);
	}

	function generateNewColor() {
		setColor(randomColor());
	}

	function onSubmit(data: z.infer<typeof RoomFormSchema>) {
		handleRoomFormSubmit(data.username, avatarSeed, color);
	}

	return (
		<div className="max-w-sm w-full flex flex-col gap-8">
			<div className="flex justify-center items-center gap-8">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="outline" size="icon" onClick={generateNewColor}>
								<RefreshCw className="w-4 h-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Cycle color</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				<div className="avatar">
					<div className="w-24 h-24">
						<img
							className="rounded-[var(--radius)] border border-input"
							src={avatarSvg}
						/>
					</div>
				</div>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								onClick={generateNewAvatarSeed}
							>
								<RefreshCw className="w-4 h-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Cycle avatar</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<div className="space-y-2">
						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Input
											autoComplete="off"
											placeholder="Enter your name"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Button variant="outline" className="w-full" type="submit">
							Create private room
						</Button>
						<Button className="w-full" type="submit">
							Join
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}

function generateRandomHash(length = 8) {
	return Array.from(crypto.getRandomValues(new Uint8Array(length)))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}
