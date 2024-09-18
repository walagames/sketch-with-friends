import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormField,
	FormItem,
	FormMessage,
	FormControl,
} from "../ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { cn } from "@/lib/utils";
import { Fragment, useRef } from "react";
import { REGEXP_ONLY_CHARS } from "input-otp";
import { useState, useEffect } from "react";
import { useRoomContext } from "@/contexts/room-context";
import { RoomEventType } from "@/types/room";
const FormSchema = z.object({
	guess: z.string(),
});
interface GuessFormProps {
	length: number;
}
export function GuessForm({ length }: GuessFormProps) {
	const { handleEvent, setGuessResponse, guessResponse, room } =
		useRoomContext();

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			guess: "",
		},
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isCorrect, setIsCorrect] = useState(false);
	const itemRef = useRef<HTMLInputElement>(null);

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		setIsSubmitting(true);
		handleEvent({ type: RoomEventType.GUESS, payload: data.guess });
	}

	async function onChange() {
		if (guessResponse !== null) {
			setGuessResponse(null);
		}
	}

	useEffect(() => {
		if (guessResponse !== null) {
			if (guessResponse) {
				setIsCorrect(guessResponse);
			} else {
				itemRef.current?.focus();
				form.setError("guess", { message: "Incorrect guess" });
				setIsSubmitting(false);
			}
		}
	}, [guessResponse, form]);

	useEffect(() => {
		setIsSubmitting(false);
		setIsCorrect(false);
		setGuessResponse(null);
		form.reset();
	}, [room.game.currentPhaseDeadline]);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} onChange={onChange}>
				<FormField
					control={form.control}
					name="guess"
					render={({ field }) => (
						<FormItem className="relative space-y-0">
							<FormControl>
								<InputOTP
									pattern={REGEXP_ONLY_CHARS}
									inputMode="text"
									disabled={form.formState.isValidating || isSubmitting}
									autoFocus
									maxLength={length}
									{...field}
									// ref={itemRef}
								>
									<InputOTPGroup ref={itemRef} className="gap-1.5 w-full flex">
										{Array.from({ length }).map((_, index) => (
											<InputOTPSlot
												ref={index === length - 1 ? itemRef : null}
												key={index}
												index={index}
												className={cn(
													"rounded-md border border-input bg-background uppercase w-1/4 duration-0 aspect-square",
													form.formState.errors.guess &&
														"border-red-600 bg-red/900/15 shake",
													isCorrect && "border-green-600 bg-green/900/15",
													isSubmitting && "brightness-75"
												)}
											/>
										))}
									</InputOTPGroup>
								</InputOTP>
							</FormControl>
						</FormItem>
					)}
				></FormField>
			</form>
		</Form>
	);
}
