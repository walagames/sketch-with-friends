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
import { DicesIcon, StepBackIcon, StepForwardIcon } from "lucide-react";
import { getRealtimeHref } from "@/lib/realtime";
import { useDispatch, useSelector } from "react-redux";
import { RaisedButton } from "@/components/ui/raised-button";
import { enterRoomCode } from "@/state/features/client";
import { HillScene } from "@/components/scenes/hill-scene";
import { RaisedInput } from "@/components/ui/raised-input";
export function EnterPlayerInfoView() {
	return (
		<HillScene>
			<PlayerInfoForm />
		</HillScene>
	);
}

const colors = [
	"e02929",
	"e08529",
	"e0da29",
	"5de029",
	"29e0d4",
	"9129e0",
	"e029ce",
];

function randomAvatarSeed() {
	return Array.from(crypto.getRandomValues(new Uint8Array(8)))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

const JoinRoomFormSchema = z.object({
	username: z
		.string()
		.min(2, {
			message: "Username must be at least 2 characters.",
		})
		.max(16, {
			message: "Username must be at most 16 characters.",
		}),
});

export function PlayerInfoForm() {
	const [avatarSeed, setAvatarSeed] = useState(randomAvatarSeed());
	const [avatarSvg, setAvatarSvg] = useState("");
	// const [colorIndex, setColorIndex] = useState(0);

	const enteredRoomCode = useSelector(
		(state: RootState) => state.client.enteredRoomCode
	);

	// const cycleColor = () => {
	// 	setColorIndex((prevColorIndex) => {
	// 		const nextIndex = (prevColorIndex + 1) % colors.length;
	// 		return nextIndex;
	// 	});
	// };

	const dispatch = useDispatch();

	const form = useForm<z.infer<typeof JoinRoomFormSchema>>({
		resolver: zodResolver(JoinRoomFormSchema),
		defaultValues: {
			username: "",
		},
	});

	useEffect(() => {
		setAvatarSvg(generateAvatar(avatarSeed));
	}, [avatarSeed]);

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
					colors[0],
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
					colors[0],
			});
		}
	}

	return (
		<div className="max-w-56 w-full flex flex-col gap-5 items-center">
			<div className="flex justify-center items-center gap-2">
				<div className="w-40 aspect-square shadow-accent rounded-lg ml-2">
					<img className="rounded-lg" src={avatarSvg} />
				</div>
				<div className="flex flex-col h-full mt-3">
					<RaisedButton
						shift={false}
						variant="action"
						size="tall"
						onClick={() => setAvatarSeed(randomAvatarSeed())}
					>
						<DicesIcon className="w-5 h-5 -translate-y-0.5" />
					</RaisedButton>
				</div>
			</div>
			<Form {...form}>
				<form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
					<FormField
						control={form.control}
						name="username"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<div className="relative w-full">
										<RaisedInput
											autoComplete="off"
											placeholder="Name"
											{...field}
										/>
										<div className="absolute -right-[3.5rem] lg:top-2 top-0">
											<RaisedButton shift={false} variant="action" size="icon">
												<StepForwardIcon className="w-6 h-6" />
											</RaisedButton>
										</div>
										<div className="absolute -left-[3.5rem] lg:top-2 top-1">
											<RaisedButton
												onClick={() => dispatch(enterRoomCode(""))}
												type="button"
												shift={false}
												variant="action"
												size="icon"
											>
												<StepBackIcon className="w-6 h-6" />
											</RaisedButton>
										</div>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</form>
			</Form>
		</div>
	);
}
