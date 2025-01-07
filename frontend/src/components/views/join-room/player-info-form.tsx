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
import {
	changeAvatarConfig,
	changeUsername,
} from "@/state/features/preferences";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import {
	BackgroundColorIcon,
	HairColorIcon,
	HairStyleIcon,
	MoodIcon,
	SkinColorIcon,
} from "@/components/ui/icons";

const backgroundColors = [
	"e02929", // RED
	"e08529", // ORANGE
	"e0da29", // YELLOW
	"5de029", // GREEN
	"29e0d4", // CYAN
	"9129e0", // PURPLE
	"e029ce", // PINK
] as const;

const hairStyles = [
	"plain",
	"wavy",
	"shortCurls",
	"parting",
	"spiky",
	"roundBob",
	"longCurls",
	"buns",
	"bangs",
	"fluffy",
	"flatTop",
	"shaggy",
] as const;

const hairColors = [
	"000000", // BLACK
	"1d5dff", // BLUE
	"ff543d", // ORANGE
	"fff500", // YELLOW
	"ffffff", // WHITE
] as const;

const moods = [
	"angry",
	"confused",
	"happy",
	"hopeful",
	"neutral",
	"sad",
	"superHappy",
] as const;

const skinColors = [
	"8d5524", // DARK_BROWN
	"c26450", // BROWN
	"e6b087", // MEDIUM
	"ffd6c0", // LIGHT
	"ffe4d3", // PALE
] as const;

export const JoinRoomFormSchema = z.object({
	username: z
		.string()
		.max(14, {
			message: "Username must be at most 14 characters.",
		})
		.refine(
			(value) =>
				value === "" || /^[a-zA-Z0-9'][a-zA-Z0-9' ]*[a-zA-Z0-9']$/.test(value),
			{
				message:
					"Username can only contain letters, numbers, apostrophes, and single spaces between words.",
			}
		)
		.refine((value) => value === "" || !value.includes("  "), {
			message: "Username cannot contain consecutive spaces.",
		})
		.refine((value) => value === "" || !value.includes("''"), {
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
}: PlayerInfoFormProps) {
	const [avatarSvg, setAvatarSvg] = useState("");

	const avatarConfig = useSelector(
		(state: RootState) => state.preferences.avatarConfig
	);

	const username = useSelector(
		(state: RootState) => state.preferences.username
	);

	const dispatch = useDispatch();

	const cycleHairStyle = () => {
		const index = hairStyles.indexOf(avatarConfig.hairStyle);
		const nextIndex = (index + 1) % hairStyles.length;
		dispatch(
			changeAvatarConfig({
				...avatarConfig,
				hairStyle: hairStyles[nextIndex],
			})
		);
	};

	const cycleHairColor = () => {
		const index = hairColors.indexOf(avatarConfig.hairColor);
		const nextIndex = (index + 1) % hairColors.length;
		dispatch(
			changeAvatarConfig({
				...avatarConfig,
				hairColor: hairColors[nextIndex],
			})
		);
	};

	const cycleMood = () => {
		const index = moods.indexOf(avatarConfig.mood);
		const nextIndex = (index + 1) % moods.length;
		dispatch(
			changeAvatarConfig({
				...avatarConfig,
				mood: moods[nextIndex],
			})
		);
	};

	const cycleSkinColor = () => {
		const index = skinColors.indexOf(avatarConfig.skinColor);
		const nextIndex = (index + 1) % skinColors.length;
		dispatch(
			changeAvatarConfig({
				...avatarConfig,
				skinColor: skinColors[nextIndex],
			})
		);
	};

	const cycleBackgroundColor = () => {
		const index = backgroundColors.indexOf(avatarConfig.backgroundColor);
		const nextIndex = (index + 1) % backgroundColors.length;
		dispatch(
			changeAvatarConfig({
				...avatarConfig,
				backgroundColor: backgroundColors[nextIndex],
			})
		);
	};

	const randomAvatarConfig = () => {
		return {
			hairStyle: hairStyles[Math.floor(Math.random() * hairStyles.length)],
			hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
			mood: moods[Math.floor(Math.random() * moods.length)],
			skinColor: skinColors[Math.floor(Math.random() * skinColors.length)],
			backgroundColor:
				backgroundColors[Math.floor(Math.random() * backgroundColors.length)],
		};
	};

	const form = useForm<z.infer<typeof JoinRoomFormSchema>>({
		resolver: zodResolver(JoinRoomFormSchema),
		defaultValues: {
			username: username ?? "",
		},
	});

	useEffect(() => {
		const subscription = form.watch((value) => {
			dispatch(changeUsername(value.username ?? ""));
		});

		return () => subscription.unsubscribe();
	}, [form, dispatch]);

	useEffect(() => {
		setAvatarSvg(generateAvatar(avatarConfig));
	}, [avatarConfig]);

	const onSubmit = (data: z.infer<typeof JoinRoomFormSchema>) => {
		const { username } = data;
		handleSubmit({
			username: username,
			avatarConfig: avatarConfig,
		});
	};

	return (
		<div className="max-w-60 w-full flex flex-col gap-5 items-center relative z-50">
			<div className="flex justify-center items-start gap-2">
				<div className="flex flex-col h-full mt-3 gap-2">
					<RaisedButton shift={false} size="iconMd" onClick={cycleSkinColor}>
						<SkinColorIcon className="size-8 translate-y-0.5" />
					</RaisedButton>
					<RaisedButton
						shift={false}
						size="iconMd"
						onClick={cycleBackgroundColor}
					>
						<BackgroundColorIcon className="size-9 translate-y-0.5" />
					</RaisedButton>
					<RaisedButton
						shift={false}
						size="iconMd"
						onClick={() => dispatch(changeAvatarConfig(randomAvatarConfig()))}
					>
						<DicesIcon className="size-5" />
					</RaisedButton>
				</div>
				<div className="w-36 mt-2 aspect-square shadow-accent rounded-lg ml-3 mr-0.5">
					<img alt="avatar" className="rounded-lg" src={avatarSvg} />
				</div>
				<div className="flex flex-col h-full mt-3 gap-2">
					<RaisedButton shift={false} size="iconMd" onClick={cycleHairStyle}>
						<HairStyleIcon className="size-8 translate-y-0.5" />
					</RaisedButton>
					<RaisedButton shift={false} size="iconMd" onClick={cycleHairColor}>
						<HairColorIcon className="size-8 translate-y-0.5" />
					</RaisedButton>
					<RaisedButton shift={false} size="iconMd" onClick={cycleMood}>
						<MoodIcon className="size-8 translate-y-0.5" />
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
