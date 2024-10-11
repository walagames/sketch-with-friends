import { Button } from "@/components/ui/button";
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
	FormMessage,
} from "@/components/ui/form";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { getRealtimeHref } from "@/lib/realtime";
import { useDispatch } from "react-redux";
export function JoinRoomView() {
	return (
		<motion.div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center gap-8">
			<div className="flex items-center gap-3">
				<img
					className="rotate-12"
					src="/logo.png"
					alt="logo"
					width={44}
					height={44}
				/>
				<h1
					style={{ wordSpacing: "0.01em" }}
					className="text-4xl font-medium tracking-tight"
				>
					Sketch with Friends
				</h1>
			</div>
			<JoinRoomForm />
		</motion.div>
	);
}

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

function randomAvatarSeed() {
	return Array.from(crypto.getRandomValues(new Uint8Array(8)))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function randomColor() {
	return colors[Math.floor(Math.random() * colors.length)];
}

const JoinRoomFormSchema = z.object({
	username: z.string().min(2, {
		message: "Username must be at least 2 characters.",
	}),
});

export function JoinRoomForm() {
	const [avatarSeed, setAvatarSeed] = useState(randomAvatarSeed());
	const [color, setColor] = useState(randomColor());
	const [avatarSvg, setAvatarSvg] = useState("");

	const dispatch = useDispatch();

	const form = useForm<z.infer<typeof JoinRoomFormSchema>>({
		resolver: zodResolver(JoinRoomFormSchema),
		defaultValues: {
			username: "",
		},
	});

	useEffect(() => {
		setAvatarSvg(generateAvatar(avatarSeed, color));
	}, [avatarSeed, color]);

	function onSubmit(data: z.infer<typeof JoinRoomFormSchema>) {
		const { username } = data;
		const roomCode = window.location.search.split("room=")[1];
		if (roomCode) {
			dispatch({
				type: "socket/connect",
				payload:
					getRealtimeHref() +
					"/join/" +
					roomCode +
					"?username=" +
					username +
					"&avatarSeed=" +
					avatarSeed +
					"&avatarColor=" +
					color,
			});
		} else {
			dispatch({
				type: "socket/connect",
				payload:
					getRealtimeHref() +
					"/host?username=" +
					username +
					"&avatarSeed=" +
					avatarSeed +
					"&avatarColor=" +
					color,
			});
		}
	}

	return (
		<div className="max-w-sm w-full flex flex-col gap-8">
			<div className="flex justify-center items-center gap-8">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								onClick={() => setColor(randomColor())}
							>
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
								onClick={() => setAvatarSeed(randomAvatarSeed())}
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
