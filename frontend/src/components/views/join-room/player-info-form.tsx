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
import { DicesIcon } from "lucide-react";
import { RaisedButton } from "@/components/ui/raised-button";
import { PlayerProfile } from "@/state/features/room";
import { RaisedInput } from "@/components/ui/raised-input";

export const colors = [
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

export const JoinRoomFormSchema = z.object({
	username: z
		.string()
		.min(1, {
			message: "Username must be at least 1 character.",
		})
		.max(14, {
			message: "Username must be at most 14 characters.",
		})
		.refine((value) => /^[a-zA-Z0-9'][a-zA-Z0-9' ]*[a-zA-Z0-9']$/.test(value), {
			message:
				"Username can only contain letters, numbers, apostrophes, and single spaces between words.",
		})
		.refine((value) => !value.includes("  "), {
			message: "Username cannot contain consecutive spaces.",
		})
		.refine((value) => !value.includes("''"), {
			message: "Username cannot contain consecutive apostrophes.",
		}),
});

interface PlayerInfoFormProps {
	children?: React.ReactNode;
	leftButton?: React.ReactNode;
	rightButton?: React.ReactNode;
	bottomButton?: React.ReactNode;
	handleSubmit: (profile: PlayerProfile) => void;
	defaultValues?: PlayerProfile;
}

export function PlayerInfoForm({
	leftButton,
	rightButton,
	bottomButton,
	handleSubmit,
	defaultValues,
}: PlayerInfoFormProps) {
	const [avatarSeed, setAvatarSeed] = useState(
		defaultValues?.avatarSeed ?? randomAvatarSeed()
	);
	const [avatarSvg, setAvatarSvg] = useState("");

	const form = useForm<z.infer<typeof JoinRoomFormSchema>>({
		resolver: zodResolver(JoinRoomFormSchema),
		defaultValues: {
			username: defaultValues?.name ?? "",
		},
	});

	useEffect(() => {
		setAvatarSvg(generateAvatar(avatarSeed));
	}, [avatarSeed]);

	const onSubmit = (data: z.infer<typeof JoinRoomFormSchema>) => {
		const { username } = data;
		handleSubmit({
			name: username,
			avatarSeed: avatarSeed,
			avatarColor: colors[0],
		});
	};

	return (
		<div className="max-w-56 w-full flex flex-col gap-5 items-center relative z-50">
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
										{rightButton && (
											<div className="absolute -right-[3.25rem] lg:-right-[3.5rem] lg:top-1.5 top-0.5">
												{rightButton}
											</div>
										)}
										{leftButton && (
											<div className="absolute -left-[3.25rem] lg:-left-[3.5rem] lg:top-2 top-1.5">
												{leftButton}
											</div>
										)}
									</div>
								</FormControl>
								<FormMessage />
								{bottomButton && (
									<div className="flex justify-end pt-2">{bottomButton}</div>
								)}
							</FormItem>
						)}
					/>
				</form>
			</Form>
		</div>
	);
}
