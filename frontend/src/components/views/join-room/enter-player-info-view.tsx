import { generateAvatar } from "@/lib/avatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { RootState } from "@/state/store";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { useEffect, useState } from "react";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	BlendIcon,
	UserIcon,
} from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { getRealtimeHref } from "@/lib/realtime";
import { useDispatch, useSelector } from "react-redux";
import { Hills } from "@/components/hills";
import { useDirectionAnimation } from "@/App";
import { RaisedButton } from "@/components/raised-button";
import { Input } from "@/components/ui/input";
import { enterRoomCode } from "@/state/features/client";
export function EnterPlayerInfoView() {
	const animationProps = useDirectionAnimation();
	return (
		<motion.div
			{...animationProps}
			className="w-full h-full absolute inset-0 flex flex-col items-center justify-center gap-8"
		>
			<PlayerInfoForm />
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

export function PlayerInfoForm() {
	const [avatarSeed, setAvatarSeed] = useState(randomAvatarSeed());
	const [color, setColor] = useState(randomColor());
	const [avatarSvg, setAvatarSvg] = useState("");

	const enteredRoomCode = useSelector(
		(state: RootState) => state.client.enteredRoomCode
	);

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

		if (enteredRoomCode && enteredRoomCode !== "new") {
			dispatch({
				type: "socket/connect",
				payload:
					getRealtimeHref() +
					"/join/" +
					enteredRoomCode +
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
		<div className="max-w-[16rem] w-full flex flex-col gap-8 items-start">
			<RaisedButton onClick={() => dispatch(enterRoomCode(""))}>
				<span className="flex items-center gap-1 flex-row">
					<ArrowLeftIcon className="w-4 h-4 -translate-y-0.5" />
					back
				</span>
			</RaisedButton>
			<div className="flex justify-start pl-3 items-center gap-8 -mt-3">
				<div className="flex flex-col gap-3 mt-3">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<RaisedButton
									shift={false}
									variant="action"
									size="icon"
									onClick={() => setAvatarSeed(randomAvatarSeed())}
								>
									<UserIcon />
								</RaisedButton>
							</TooltipTrigger>
							<TooltipContent>
								<p>Cycle avatar</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<RaisedButton
									shift={false}
									variant="action"
									size="icon"
									onClick={() => setColor(randomColor())}
								>
									<BlendIcon />
								</RaisedButton>
							</TooltipTrigger>
							<TooltipContent>
								<p>Cycle color</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
				<div className="avatar">
					<div className="w-32 aspect-square shadow-accent rounded-lg">
						<img className="rounded-lg" src={avatarSvg} />
					</div>
				</div>
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
										<div className="relative ">
											<div className="flex items-center gap-3 bg-secondary-foreground rounded-lg w-56">
												<Input
													autoComplete="off"
													placeholder="Name"
													{...field}
													className="font-bold text-xl text-zinc-400 placeholder:text-zinc-400 bg-background rounded-lg h-14 px-4 py-3.5 w-full -translate-y-1.5 translate-x-1.5"
												/>
											</div>
											<div className="absolute -right-14 top-2">
												<RaisedButton
													shift={false}
													variant="action"
													size="icon"
												>
													<ArrowRightIcon className="w-6 h-6" />
												</RaisedButton>
											</div>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</form>
			</Form>
		</div>
	);
}
