import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import CountdownTimer from "@/components/countdown-timer";
import Canvas from "@/components/canvas";
import { GameRole } from "@/state/features/game";
import { Input } from "@/components/ui/input";

const FormSchema = z.object({
	guess: z.string(),
});
export function GuessForm() {
	const dispatch = useDispatch();
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			guess: "",
		},
	});

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		dispatch({ type: "game/submitGuess", payload: data.guess });
		form.reset();
	}
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="guess"
					render={({ field }) => (
						<FormItem className="relative space-y-0">
							<FormControl>
								<Input {...field} />
							</FormControl>
						</FormItem>
					)}
				></FormField>
			</form>
		</Form>
	);
}

export function DrawingGuesserView() {
	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	const selectedWord = useSelector(
		(state: RootState) => state.game.selectedWord
	);
	return (
		<div className="flex flex-col  items-start justify-center gap-2">
			<div className="flex justify-between w-full items-center">
				<div className="flex items-center justify-center text-2xl gap-1.5">
					Round <span className="font-medium">TODO</span> of{" "}
					<span className="font-medium">TODO</span>
				</div>

				<div className="text-2xl mx-auto">
					<WordWithLetterBlanks word={selectedWord ?? "TODO"} />
				</div>
				<CountdownTimer endTime={deadline} />
			</div>
			<div className="flex w-full h-full items-start justify-center gap-2">
				<div className="flex flex-col items-center justify-center gap-2 w-[800px]">
					<Canvas width={800} height={600} role={GameRole.Guessing} />
					<GuessForm />
				</div>
			</div>
		</div>
	);
}

function WordWithLetterBlanks({ word }: { word: string }) {
	const wordLetters = word.replaceAll("*", "_").split("");
	return (
		<div className="text-2xl mx-auto">
			{wordLetters.map((letter, index) => (
				<span key={index}>{letter}</span>
			))}
		</div>
	);
}
