import { useEffect, useRef } from "react";
import { RootState } from "@/state/store";
import { Guess } from "@/state/features/game";
import { Player } from "@/state/features/room";
import { generateAvatar } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { RaisedButton } from "@/components/raised-button";
import { SendIcon, Tally5Icon, UsersIcon } from "lucide-react";

export function Guesses({ isGuessing }: { isGuessing?: boolean }) {
	const guesses = useSelector((state: RootState) => state.game.guesses);
	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.client.id);
	const currentRound = useSelector(
		(state: RootState) => state.game.currentRound
	);
	const totalRounds = useSelector(
		(state: RootState) => state.room.settings.totalRounds
	);
	const listRef = useRef<HTMLUListElement>(null);

	useEffect(() => {
		if (listRef.current) {
			listRef.current.scrollTop = listRef.current.scrollHeight;
		}
	}, [guesses]);

	const correctGuesses = guesses.filter((guess) => guess.isCorrect);
	const hasGuessedCorrect = correctGuesses.find(
		(guess) => guess.playerId === playerId
	);

	return (
		<div className="flex flex-col h-[700px] w-[20rem]">
			<div className="flex gap-4 ml-auto">
				<div className="flex gap-2 text-lg font-bold items-center">
					<Tally5Icon className="h-5 w-5 mb-0.5" /> {currentRound}/{totalRounds}
				</div>
				<div className="flex gap-2 text-lg font-bold items-center">
					<UsersIcon className="h-5 w-5 mb-0.5" /> {Object.keys(players).length}
				</div>
			</div>
			<ul
				ref={listRef}
				className="h-full w-full mb-6 mt-2 flex gap-3 bg-zinc-400/10 border-4 border-border border-dashed rounded-lg flex-col items-start justify-start py-8 px-6 overflow-y-auto overflow-x-hidden scrollbar-hide"
			>
				{guesses.map((guess) => (
					<GuessCard
						key={guess.playerId}
						guess={guess}
						player={players[guess.playerId]}
					/>
				))}
			</ul>
			{isGuessing && 
				(hasGuessedCorrect ? (
					<div className="font-bold text-xl bg-background rounded-lg h-14 px-4 py-3.5 w-full -translate-y-1.5 translate-x-1.5 shadow-accent">
						<span className="translate-y-0.5 flex items-center justify-center gap-2">
							Guessed it!{" "}
							<span className="text-lg">
								+{hasGuessedCorrect.pointsAwarded} pts
							</span>
						</span>
					</div>
				) : (
					<GuessForm />
				))}
		</div>
	);
}

function GuessCard({ guess, player }: { guess: Guess; player: Player }) {
	const { avatarSeed, name } = player;

	const avatarSvg = generateAvatar(avatarSeed);
	return (
		<motion.li
			initial={{ opacity: 0, y: 3 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex items-start gap-1"
		>
			<img
				alt={player.name + " profile picture"}
				className="rounded-lg h-8 aspect-square relative border-2"
				src={avatarSvg}
			/>
			<div className="flex flex-col">
				<div className="flex gap-2 justify-between font-medium">
					<p className="text-sm">{name}</p>
					{!!guess.pointsAwarded && (
						<p className="text-sm">+{guess.pointsAwarded} pts</p>
					)}
				</div>
				<div className="relative">
					<div
						className={cn(
							"bg-background rounded-lg rounded-tl-none border-2 relative z-10 font-semibold flex overflow-hidden",
							guess.isCorrect && "bg-[#40FF00]"
						)}
					>
						{guess.isCorrect ? (
							<span className="px-3 py-2">guessed the word!</span>
						) : (
							<span className="px-3 py-2">"{guess.guess}"</span>
						)}
						{!guess.isCorrect && (
							<span
								className={cn(
									"w-2 block",
									guess.isClose ? "bg-blue-500" : "bg-red-500"
								)}
							/>
						)}
					</div>
					<div className="rounded-lg rounded-tl-none bg-foreground -bottom-0.5 -left-0.5 h-full w-full absolute"></div>
				</div>
			</div>
		</motion.li>
	);
}

const FormSchema = z.object({
	guess: z.string().min(1),
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
		const trimmedGuess = data.guess.trim();
		if (trimmedGuess) {
			dispatch({ type: "game/submitGuess", payload: trimmedGuess });
			form.reset();
		}
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
								<div className="flex items-center gap-3 ">
									<div className="flex items-center gap-3 bg-secondary-foreground rounded-lg flex-1">
										<Input
											autoComplete="off"
											placeholder="Guess"
											{...field}
											className="font-bold text-xl text-foreground placeholder:text-zinc-400 bg-background rounded-lg h-14 px-4 py-3.5 w-full -translate-y-1.5 translate-x-1.5"
										/>
									</div>
									<div className="">
										<RaisedButton shift={false} variant="action" size="icon">
											<SendIcon className="w-6 h-6" />
										</RaisedButton>
									</div>
								</div>
							</FormControl>
						</FormItem>
					)}
				></FormField>
			</form>
		</Form>
	);
}
