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
import { motion } from "framer-motion";
import { useDirectionAnimation } from "@/App";
import { Hills } from "@/components/hills";
import { getPickingPlayer } from "@/lib/player";

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
	const directionProps = useDirectionAnimation();

	const players = useSelector((state: RootState) => state.room.players);

	const drawingPlayer = getPickingPlayer(players);

	const deadline = useSelector(
		(state: RootState) => state.game.currentPhaseDeadline
	);
	const selectedWord = useSelector(
		(state: RootState) => state.game.selectedWord
	);

	return (
		<motion.div
			{...directionProps}
			className="flex h-full flex-col items-center justify-center w-full absolute inset-0"
		>
			<div className="flex flex-col  items-start justify-center gap-2 relative z-50">
				<div className="flex justify-between w-full items-end">
					<div className="text-2xl">
						{drawingPlayer?.name} is drawing:{" "}
						<WordWithLetterBlanks word={selectedWord} />
					</div>
					<CountdownTimer
						key={deadline}
						endTime={new Date(deadline).getTime()}
					/>
				</div>
				<div className="flex w-full h-full items-start justify-center gap-2">
					<div className="flex flex-col items-center justify-center gap-2 w-[800px]">
						<Canvas width={800} height={600} role={GameRole.Guessing} />
						<GuessForm />
					</div>
				</div>
			</div>
			<Hills />
		</motion.div>
	);
}

function WordWithLetterBlanks({ word }: { word: string }) {
	const wordLetters = word.replaceAll("*", "_").split("");
	return (
		<span className="text-3xl font-bold">
			{wordLetters.map((letter, index) => (
				<span key={index}>{letter}</span>
			))}
		</span>
	);
}
