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
import { RaisedButton } from "@/components/ui/raised-button";
import { SendIcon, UsersIcon } from "lucide-react";
import { RaisedInput } from "@/components/ui/raised-input";

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
		<div
			className={cn(
				"flex flex-col lg:h-full xl:w-[18rem] w-full xl:max-h-[660px] min-h-[12rem] px-1.5 lg:px-0",
				isGuessing
					? "h-[var(--max-chat-height)]"
					: "h-[var(--max-chat-height-drawing)]"
			)}
		>
			<div className="flex w-full justify-between items-center lg:h-14 pt-3 pb-1">
				<div className="flex gap-2 text-lg lg:text-xl font-bold items-center ">
					Round {currentRound} of {totalRounds}
				</div>
				<div className="flex gap-2 text-xl font-bold items-center">
					<UsersIcon className="h-5 w-5 mb-1" /> {Object.keys(players).length}
				</div>
			</div>
			<ul
				ref={listRef}
				className=" flex-1 w-full flex gap-3 bg-zinc-400/10 border-4 border-border border-dashed rounded-lg flex-col items-start justify-start p-5 overflow-y-auto overflow-x-hidden scrollbar-hide"
			>
				{guesses.map((guess) => (
					<GuessCard
						key={guess.id}
						guess={guess}
						player={players[guess.playerId]}
					/>
				))}
			</ul>
			{isGuessing && (
				<div className="lg:mt-6 mt-4 w-full">
					{hasGuessedCorrect ? (
						<div className="font-bold w-full text-xl bg-background rounded-lg h-14 px-4 py-3.5 -translate-y-1.5 translate-x-1.5 shadow-accent">
							<span className="translate-y-0.5 flex items-center justify-center gap-2">
								Guessed it!{" "}
								<span className="text-lg">
									+{hasGuessedCorrect.pointsAwarded} pts
								</span>
							</span>
						</div>
					) : (
						<GuessForm />
					)}
				</div>
			)}
		</div>
	);
}

function GuessCard({ guess, player }: { guess: Guess; player: Player }) {
	const { avatarSeed, name } = player;
	const avatarSvg = generateAvatar(avatarSeed);
	const playerId = useSelector((state: RootState) => state.client.id);
	const isOwnMessage = playerId === guess.playerId;

	return (
		<motion.li
			initial={{ opacity: 0, y: 3 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				"flex items-start gap-1 ",
				isOwnMessage && "flex-row-reverse items-end pt-2 -mb-2 ml-auto"
			)}
		>
			<img
				alt={player.name + " profile picture"}
				className={cn(
					"h-8 aspect-square relative border-2 shrink-0",
					isOwnMessage ? "rounded-lg" : "rounded-lg"
				)}
				src={avatarSvg}
			/>
			<div
				className={cn(
					"flex flex-col min-w-0 flex-1",
					isOwnMessage && "items-end"
				)}
			>
				<div
					className={cn(
						"flex gap-2 font-medium w-full",
						isOwnMessage ? "justify-end order-2" : "justify-between"
					)}
				>
					<p
						className={cn(
							"text-sm truncate",
							isOwnMessage && "order-2 ml-auto"
						)}
					>
						{name}
					</p>
					{!!guess.pointsAwarded && (
						<p className="text-sm shrink-0">+{guess.pointsAwarded} pts</p>
					)}
				</div>
				<div className="w-full relative">
					<div
						className={cn(
							"bg-background border-2 relative z-10 font-semibold flex overflow-hidden w-full",
							isOwnMessage
								? "rounded-lg rounded-br-none"
								: "rounded-lg rounded-tl-none",
							guess.isCorrect && "bg-[#40FF00]"
						)}
					>
						{guess.isCorrect ? (
							<span className="px-3 py-2">guessed the word!</span>
						) : (
							<span className="px-3 py-2 break-all">{guess.guess}</span>
						)}
						{!guess.isCorrect && guess.isClose && (
							<div className="w-1.5 bg-blue-500 ml-auto" />
						)}
					</div>
					<div
						className={cn(
							"bg-foreground h-full w-full absolute",
							isOwnMessage
								? "rounded-lg rounded-br-none -bottom-0.5 -right-0.5"
								: "rounded-lg rounded-tl-none -bottom-0.5 -left-0.5"
						)}
					/>
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
									<RaisedInput
										autoComplete="off"
										placeholder="Guess"
										{...field}
									/>
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
