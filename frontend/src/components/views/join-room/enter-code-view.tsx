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
import { ArrowRightIcon, RefreshCw } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { getRealtimeHref } from "@/lib/realtime";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { useNavigate, createSearchParams } from "react-router-dom";
import { Hills } from "@/components/hills";
import { useDirectionAnimation } from "@/App";
import { RaisedButton } from "@/components/raised-button";
export function EnterCodeView() {
	const animationProps = useDirectionAnimation();
	const roomCode = useSelector(
		(state: RootState) => state.client.enteredRoomCode
	);

	const navigate = useNavigate();

	function onSubmit(code: string) {
		navigate({
			pathname: "/",
			search: createSearchParams({
				room: code,
			}).toString(),
		});
	}

	const codePlaceholder = roomCode ? roomCode : "Room code";
	return (
		<motion.div
			{...animationProps}
			className="w-full h-full absolute inset-0 flex flex-col items-center justify-center gap-8"
		>
			<div className="flex items-center gap-3">
				<img
					className=""
					src="/logo-full.png"
					alt="logo"
					width={230}
					height={102}
				/>
			</div>
			<div className="flex flex-col items-center gap-4">
				<RaisedButton
					size="xl"
					variant="action"
					className="w-full"
					onClick={() => onSubmit("new")}
				>
					Create room
				</RaisedButton>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						onSubmit(e.currentTarget.roomCode.value);
					}}
					className="flex items-center gap-3 relative"
				>
					<div className="relative ">
						<div className="flex items-center gap-3 bg-secondary-foreground rounded-lg">
							<Input
								autoComplete="off"
								placeholder={codePlaceholder}
								className="font-bold text-xl text-zinc-400 placeholder:text-zinc-400 bg-background rounded-lg h-14 px-4 py-3.5 w-64 -translate-y-1.5 translate-x-1.5"
							/>
						</div>
						<div className="absolute -right-14 top-2">
							<RaisedButton shift={false} variant="action" size="icon">
								<ArrowRightIcon className="w-6 h-6" />
							</RaisedButton>
						</div>
					</div>
				</form>
			</div>
			{/* <JoinRoomForm /> */}
			<Hills />
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
