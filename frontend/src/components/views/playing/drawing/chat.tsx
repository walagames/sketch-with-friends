import { useEffect, useRef, useState } from "react";
import { RootState } from "@/state/store";
import { ChatMessage, GameRole } from "@/state/features/game";
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
import { useMediaQuery } from "@/hooks/use-media-query";
export function Chat() {
	const chatMessages = useSelector(
		(state: RootState) => state.game.chatMessages
	);
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

	const isLargeScreen = useMediaQuery("(min-width: 1024px)");

	const [showNewMessages, setShowNewMessages] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);

	const listRef = useRef<HTMLUListElement>(null);

	useEffect(() => {
		if (listRef.current && chatMessages.length > 0) {
			const latestMessage = chatMessages[chatMessages.length - 1];
			const isOwnMessage = latestMessage.playerId === playerId;

			const isScrolledToBottom =
				listRef.current.scrollTop >=
				listRef.current.scrollHeight - listRef.current.offsetHeight - 300;

			if (isOwnMessage || isScrolledToBottom) {
				// on mobile we need to wait for the keyboard to close before scrolling
				// otherwise it makes the scroll jump and it looks bad
				if (isOwnMessage && !isLargeScreen) {
					setTimeout(() => {
						listRef.current?.scrollTo({
							top: listRef.current.scrollHeight,
							behavior: "smooth",
						});
					}, 175);
				} else {
					listRef.current?.scrollTo({
						top: listRef.current.scrollHeight,
						behavior: "smooth",
					});
				}
				setUnreadCount(0);
			} else {
				setShowNewMessages(true);
				setUnreadCount((prev) => prev + 1);
			}
		}
	}, [chatMessages, playerId]);

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
				"flex flex-col lg:h-full xl:w-[20rem] w-full xl:max-h-[660px] min-h-[12rem] px-0.5 lg:px-0 relative z-30 gap-1.5",
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
					<UsersIcon className="size-5 mb-1" /> {Object.values(players).length}
				</div>
				<div className="bg-gradient-to-b from-background-secondary to-transparent top-[0.625rem] left-2 right-2  rounded-lg h-14 absolute z-10 lg:hidden" />
			</div>
			<div className="relative flex-1 overflow-hidden">
				<div className="h-14 w-full absolute lg:hidden z-50 top-0 flex overflow-hidden items-start">
					<div className="flex gap-1.5 text-xl font-bold items-center relative ml-auto z-20 px-4 py-2">
						<UsersIcon className="size-5 mb-1" />{" "}
						{Object.values(players).length}
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
				<motion.ul
					ref={listRef}
					onScroll={handleScroll}
					className={cn(
						"h-full mx-1 flex gap-3 break-all lg:border-4 border-[3px] bg-background-secondary/50 backdrop-blur-[4px] border-border border-dashed rounded-lg flex-col items-start justify-start overflow-y-auto overflow-x-hidden scrollbar-hide p-4 pt-8 lg:pt-3.5 lg:pb-6",
						"contain-strict"
					)}
				>
					{chatMessages.map((message) => (
						<ChatMessageComponent
							key={message.id}
							message={message}
							player={players[message.playerId]}
						/>
					))}
				</motion.ul>
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

function ChatMessageComponent({
	message,
	player,
}: {
	message: ChatMessage;
	player: Player | null;
}) {
	const playerId = useSelector((state: RootState) => state.client.id);

	// If it's a system message, render a simplified version
	if (message.isSystemMessage) {
		return (
			<motion.li
				initial={{ opacity: 0, y: 3, scale: 0.9 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				className="mx-auto text-center py-2 px-3 rounded-lg bg-white"
			>
				<span
					style={{ wordBreak: "break-word" }}
					className="block text-sm font-semibold max-w-full"
				>
					{message.guess}
				</span>
			</motion.li>
		);
	}

	if (!player) return null;

	const { avatarSeed, name } = player.profile;
	const avatarSvg = generateAvatar(avatarSeed);
	const isOwnMessage = playerId === message.playerId;

	return (
		<motion.li
			initial={{ opacity: 0, y: 3 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				"flex items-start gap-1 ",
				isOwnMessage && "flex-row-reverse items-end ml-auto"
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
						{name}{" "}
						{isOwnMessage && (
							<span className="text-xs text-foreground/50 px-0.5">(You)</span>
						)}
					</p>
					{!!message.pointsAwarded && (
						<p className="text-xs shrink-0 py-0.5 px-1">
							+{message.pointsAwarded} pts
						</p>
					)}
				</div>
				<div className="w-full relative">
					<div
						className={cn(
							"bg-background border-2 relative z-10 font-semibold flex overflow-hidden w-full max-w-full",
							isOwnMessage
								? "rounded-lg rounded-br-none"
								: "rounded-lg rounded-tl-none",
							message.isCorrect && isOwnMessage && "bg-[#40FF00]"
						)}
					>
						{isOwnMessage && message.isClose && (
							<div className="w-1.5 bg-blue-500 ml-auto" />
						)}
						{message.isCorrect ? (
							<span className="px-3 py-2">
								{isOwnMessage ? "You guessed it!" : "Guessed it!"}
							</span>
						) : (
							<span className="px-3 py-2 break-words overflow-wrap-anywhere w-full">
								{message.guess}
							</span>
						)}
						{!isOwnMessage && (message.isClose || message.isCorrect) && (
							<div
								className={cn(
									"w-1.5 bg-blue-500 ml-auto",
									message.isCorrect && !isOwnMessage && "bg-green-500"
								)}
							/>
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
	message: z.string().min(1),
});
export function ChatForm({ isGuessing }: { isGuessing?: boolean }) {
	const dispatch = useDispatch();
	const [messageHistory, setMessageHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [currentMessage, setCurrentMessage] = useState("");

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			message: "",
		},
	});

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowUp") {
			e.preventDefault();
			if (historyIndex < messageHistory.length - 1) {
				const newIndex = historyIndex + 1;
				setHistoryIndex(newIndex);
				const historicMessage = messageHistory[newIndex];
				form.setValue("message", historicMessage);
				setCurrentMessage(historicMessage);
			}
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			if (historyIndex > -1) {
				const newIndex = historyIndex - 1;
				setHistoryIndex(newIndex);
				const historicMessage =
					newIndex === -1 ? currentMessage : messageHistory[newIndex];
				form.setValue("message", historicMessage);
			}
		}
	};

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		const trimmedMessage = data.message.trim();
		if (trimmedMessage) {
			setMessageHistory((prev) => [trimmedMessage, ...prev]);
			setHistoryIndex(-1);
			setCurrentMessage("");
			dispatch({ type: "game/submitChatMessage", payload: trimmedMessage });
			form.reset();
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="message"
					render={({ field }) => (
						<FormItem className="relative space-y-0">
							<FormControl>
								<div className="flex items-center gap-3 ">
									<RaisedInput
										autoComplete="off"
										placeholder={isGuessing ? "Guess" : "Chat"}
										onKeyDown={handleKeyDown}
										{...field}
										onChange={(e) => {
											field.onChange(e);
											if (historyIndex === -1) {
												setCurrentMessage(e.target.value);
											}
										}}
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
