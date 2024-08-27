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
import { Fragment } from "react";
import { REGEXP_ONLY_CHARS } from "input-otp";

const FormSchema = z.object({
	guess: z.string(),
});
interface GuessFormProps {
	onSubmit: (guess: string) => Promise<void | Error>;
	length: number;
}
export function GuessForm({ onSubmit, length }: GuessFormProps) {
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			guess: "",
		},
	});

	async function onComplete(data: z.infer<typeof FormSchema>) {
		console.log(data);
		// try {
		// 	await onSubmit(data.guess);
		// } catch (error) {
		// 	if (error instanceof Error) {
		// 		form.setError("guess", { type: "custom", message: error.message });
		// 	}
		// }
	}

	return (
		<Form {...form}>
			<FormField
				control={form.control}
				name="guess"
				render={({ field }) => (
					<FormItem className="relative">
						<FormMessage className="absolute -bottom-7" />
						<FormControl>
							<InputOTP
								pattern={REGEXP_ONLY_CHARS}
								{...field}
								onComplete={form.handleSubmit(onComplete)}
								inputMode="text"
								// disabled={form.formState.isValidating}
								autoFocus
								maxLength={length}
							>
								<InputOTPGroup className="gap-2 w-full">
									{Array.from({ length }).map((_, index) => (
										<InputOTPSlot
											key={index}
											index={index}
											className={cn(
												"rounded-lg border border-blue-600 bg-blue-900/15 uppercase w-1/4 duration-0 aspect-square",
												form.formState.errors.guess &&
													"border-red-600 bg-red/900/15 shake",
												form.formState.isSubmitting && "brightness-75"
											)}
										/>
									))}
								</InputOTPGroup>
							</InputOTP>
						</FormControl>
					</FormItem>
				)}
			></FormField>
		</Form>
	);
}
