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
import { UsersIcon } from "lucide-react";
import { RaisedInput } from "@/components/ui/raised-input";

export function Guesses({ isGuessing }: { isGuessing?: boolean }) {
	const guesses = useSelector((state: RootState) => state.game.guesses);
	const players = useSelector((state: RootState) => state.room.players);
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

	return (
		<div
			className={cn(
				"flex flex-col lg:h-full xl:w-[20rem] w-full xl:max-h-[660px] min-h-[12rem] px-1.5 lg:px-0 relative z-30",
				isGuessing
					? "h-[var(--max-chat-height)]"
					: "h-[var(--max-chat-height-drawing)]"
			)}
		>
			<div className=" bg-gradient-to-b from-[#aef1fe] to-transparent top-[0.625rem] left-2 right-2  rounded-lg h-24 absolute z-10" />

			<div className="flex w-full justify-between items-center lg:items-end h-16 lg:h-12 xl:mt-1 py-1.5 lg:py-2  px-4 lg:px-0.5 -mb-14 z-10 relative">
				<div className="flex gap-2 lg:text-xl font-bold items-center relative">
					Round {currentRound} of {totalRounds}
				</div>
				<div className="flex gap-1.5 text-lg lg:text-xl font-bold items-center relative">
					<UsersIcon className="size-5 mb-1" /> {Object.keys(players).length}
				</div>
			</div>
			<ul
				ref={listRef}
				className={cn(
					"flex-1 w-full flex gap-3 lg:border-4 border-[3px] bg-[#aef1fe]/50 backdrop-blur-sm border-border border-dashed rounded-lg flex-col items-start justify-start p-5 overflow-y-auto overflow-x-hidden scrollbar-hide"
				)}
			>
				{guesses.map((guess) => (
					<GuessCard
						key={guess.id}
						guess={guess}
						player={players[guess.playerId]}
					/>
				))}
			</ul>
			<div className="mt-4 w-full">
				<GuessForm isGuessing={isGuessing} />
			</div>
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
							<span className="px-3 py-2">
								{isOwnMessage ? "You guessed it!" : "Guessed it!"}
							</span>
						) : (
							<span
								style={{ overflowWrap: "anywhere" }}
								className="px-3 py-2 break-words"
							>
								{guess.guess}
							</span>
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
export function GuessForm({ isGuessing }: { isGuessing?: boolean }) {
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
										placeholder={isGuessing ? "Guess" : "Chat"}
										{...field}
									/>
									{/* <div className="">
										<RaisedButton shift={false} variant="action" size="icon">
											<SendIcon className="lg:size-6 size-5" />
										</RaisedButton>
									</div> */}
								</div>
							</FormControl>
						</FormItem>
					)}
				></FormField>
			</form>
		</Form>
	);
}
