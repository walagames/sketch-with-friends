import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { RaisedButton } from "@/components/ui/raised-button";
import { enterRoomCode } from "@/state/features/client";
import { useEffect } from "react";
import { StepForwardIcon } from "lucide-react";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { RaisedInput } from "@/components/ui/raised-input";
import { RoomState } from "@/state/features/room";
import { setCurrentState } from "@/state/features/room";

const CodeFormSchema = z.object({
	roomCode: z
		.string()
		.length(4, {
			message: "Room code must be 4 characters long.",
		})
		.regex(/^[A-Za-z]+$/, {
			message: "Room code must contain only letters.",
		}),
});

export function CodeForm() {
	const dispatch = useDispatch();
	const searchParams = new URLSearchParams(location.search);
	const roomCodeParam = searchParams.get("room");

	const form = useForm<z.infer<typeof CodeFormSchema>>({
		resolver: zodResolver(CodeFormSchema),
		defaultValues: {
			roomCode: roomCodeParam ?? "",
		},
	});

	useEffect(() => {
		form.setValue("roomCode", roomCodeParam ?? "");
	}, [roomCodeParam, form]);

	function onSubmit(data: z.infer<typeof CodeFormSchema>) {
		dispatch(enterRoomCode(data.roomCode));
		dispatch(setCurrentState(RoomState.EnterPlayerInfo));
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="roomCode"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<div className="relative w-full">
									<RaisedInput
										placeholder="Enter a room code"
										{...field}
										onChange={(e) => {
											field.onChange(e.target.value.toUpperCase());
										}}
									/>
									<div className="absolute -right-[3.25rem] lg:-right-14 lg:top-2 top-0.5">
										<RaisedButton
											type="submit"
											shift={false}
											variant="action"
											size="icon"
										>
											<StepForwardIcon className="size-5 lg:size-6" />
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
	);
}
