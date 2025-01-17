import { Avatar, AvatarConfig, generateAvatar } from "@/lib/avatar";
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
import { RaisedInput } from "@/components/ui/raised-input";
import { changeAvatarConfig, changeUsername } from "@/state/features/client";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import {
	BackgroundColorIcon,
	HairColorIcon,
	HairStyleIcon,
	MoodIcon,
	SkinColorIcon,
} from "@/components/ui/icons";

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
	handleSubmit: (data: {
		username: string;
		avatarConfig: AvatarConfig;
	}) => void;
}

export function PlayerInfoForm({
	leftButton,
	rightButton,
	bottomButton,
	handleSubmit,
}: PlayerInfoFormProps) {
	const [avatarSvg, setAvatarSvg] = useState("");

	const avatarConfig = useSelector(
		(state: RootState) => state.client.avatarConfig
	);

	const username = useSelector((state: RootState) => state.client.username);

	const dispatch = useDispatch();

	const cycleHairStyle = () => {
		dispatch(
			changeAvatarConfig({
				...avatarConfig,
				hairStyle: Avatar.cycleProperty(
					avatarConfig.hairStyle,
					Avatar.hairStyles
				),
			})
		);
	};

	const cycleHairColor = () => {
		dispatch(
			changeAvatarConfig({
				...avatarConfig,
				hairColor: Avatar.cycleProperty(
					avatarConfig.hairColor,
					Avatar.hairColors
				),
			})
		);
	};

	const cycleMood = () => {
		dispatch(
			changeAvatarConfig({
				...avatarConfig,
				mood: Avatar.cycleProperty(avatarConfig.mood, Avatar.moods),
			})
		);
	};

	const cycleSkinColor = () => {
		dispatch(
			changeAvatarConfig({
				...avatarConfig,
				skinColor: Avatar.cycleProperty(
					avatarConfig.skinColor,
					Avatar.skinColors
				),
			})
		);
	};

	const cycleBackgroundColor = () => {
		dispatch(
			changeAvatarConfig({
				...avatarConfig,
				backgroundColor: Avatar.cycleProperty(
					avatarConfig.backgroundColor,
					Avatar.backgroundColors
				),
			})
		);
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
						onClick={() => dispatch(changeAvatarConfig(Avatar.random()))}
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
