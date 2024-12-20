import { useEffect, useRef, useState } from "react";
import { RootState } from "@/state/store";
import { GameRole, Guess } from "@/state/features/game";
import { Player } from "@/state/features/room";
import { generateAvatar } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { useDispatch, useSelector } from "react-redux";
import { RaisedInput } from "@/components/ui/raised-input";
import { VirtualKeyboard } from "./virtual-keyboard";
import { UsersIcon } from "lucide-react";
import { getGameRole } from "@/lib/player";
export function Chat() {
	const guesses = useSelector((state: RootState) => state.game.guesses);
	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.client.id);

	const currentRound = useSelector(
		(state: RootState) => state.game.currentRound
	);
	const totalRounds = useSelector(
		(state: RootState) => state.room.settings.totalRounds
	);
	const role = getGameRole(playerId, players);
	const isGuessing = role === GameRole.Guessing;

	const [showNewMessages, setShowNewMessages] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);

	const listRef = useRef<HTMLUListElement>(null);

	useEffect(() => {
		if (listRef.current && guesses.length > 0) {
			const latestGuess = guesses[guesses.length - 1];
			const isOwnMessage = latestGuess.playerId === playerId;

			const isScrolledToBottom =
				listRef.current.scrollTop >=
				listRef.current.scrollHeight - listRef.current.offsetHeight - 300;

			if (isOwnMessage || isScrolledToBottom) {
				listRef.current.scrollTo({
					top: listRef.current.scrollHeight,
					behavior: "smooth",
				});
				setUnreadCount(0);
			} else {
				setShowNewMessages(true);
				setUnreadCount((prev) => prev + 1);
			}
		}
	}, [guesses, playerId]);

	const handleScroll = () => {
		if (listRef.current) {
			const isScrolledToBottom =
				listRef.current.scrollTop >=
				listRef.current.scrollHeight - listRef.current.offsetHeight - 50;

			if (isScrolledToBottom) {
				setShowNewMessages(false);
				setUnreadCount(0);
			}
		}
	};

	useEffect(() => {
		if (listRef.current) {
			listRef.current.scrollTop = listRef.current.scrollHeight;
		}
	}, []);

	return (
		<div
			className={cn(
				"flex flex-col lg:h-full xl:w-[20rem] w-full xl:max-h-[660px] min-h-[12rem] px-0.5 lg:px-0 relative z-30 gap-2",
				isGuessing
					? "h-[var(--max-chat-height)]"
					: "h-[var(--max-chat-height-drawing)]"
			)}
		>
			<div className="overflow-hidden w-full justify-between items-end h-14 py-2 px-0.5 hidden lg:flex">
				<div className="gap-2 lg:text-xl font-bold items-center relative hidden lg:flex z-20">
					Round {currentRound} of {totalRounds}
				</div>
				<div className="flex gap-1.5 text-lg lg:text-xl font-bold items-center relative ml-auto z-20">
					<UsersIcon className="size-5 mb-1" /> {Object.keys(players).length}
				</div>
				<div className="bg-gradient-to-b from-background-secondary to-transparent top-[0.625rem] left-2 right-2  rounded-lg h-14 absolute z-10 lg:hidden" />
			</div>
			<div className="relative flex-1 overflow-hidden">
				<div className="h-14 w-full absolute lg:hidden z-50 top-0 flex overflow-hidden items-start">
					<div className="flex gap-1.5 text-xl font-bold items-center relative ml-auto z-20 px-4 py-2">
						<UsersIcon className="size-5 mb-1" /> {Object.keys(players).length}
					</div>
					<div className="bg-gradient-to-b from-background-secondary to-transparent rounded-lg h-14 absolute top-0.5 left-2 right-2" />
				</div>
				<AnimatePresence>
					{showNewMessages && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
							className="absolute bottom-4 w-full flex justify-center z-50"
						>
							<motion.div
								className="bg-white shadow-accent-sm px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1"
								onClick={() => {
									setShowNewMessages(false);
									setUnreadCount(0);
									listRef.current?.scrollTo({
										top: listRef.current.scrollHeight,
										behavior: "smooth",
									});
								}}
							>
								{unreadCount} new message{unreadCount !== 1 ? "s" : ""}
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
				<ul
					ref={listRef}
					onScroll={handleScroll}
					className={cn(
						"h-full mx-1 flex gap-3 break-all lg:border-4 border-[3px] bg-background-secondary/50 backdrop-blur-[4px] border-border border-dashed rounded-lg flex-col items-start justify-start overflow-y-auto overflow-x-hidden scrollbar-hide p-4",
						"contain-strict"
					)}
				>
					{guesses.map((guess) => (
						<ChatMessage
							key={guess.id}
							guess={guess}
							player={players[guess.playerId]}
						/>
					))}
				</ul>
			</div>
			<div className="mt-2 w-full hidden sm:block h-16">
				<ChatForm isGuessing={isGuessing} />
			</div>
			<div className="w-full sm:hidden">
				<VirtualKeyboard className="w-full" />
			</div>
		</div>
	);
}

function ChatMessage({ guess, player }: { guess: Guess; player: Player }) {
	const { avatarSeed, name } = player.profile;
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
				alt={player.profile.name + " profile picture"}
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
							"bg-background border-2 relative z-10 font-semibold flex overflow-hidden w-full max-w-full",
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
							<span className="px-3 py-2 break-words overflow-wrap-anywhere w-full">
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
export function ChatForm({ isGuessing }: { isGuessing?: boolean }) {
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
								</div>
							</FormControl>
						</FormItem>
					)}
				></FormField>
			</form>
		</Form>
	);
}
