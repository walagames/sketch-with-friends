import { useEffect, useRef, useState } from "react";
import { RootState } from "@/state/store";
import { GameRole } from "@/state/features/game";
import { ChatMessage, ChatMessageType, Player } from "@/state/features/room";
import { generateAvatar } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { useDispatch, useSelector } from "react-redux";
import { RaisedInput } from "@/components/ui/raised-input";
import { VirtualKeyboard } from "./virtual-keyboard";
import { getGameRole } from "@/lib/player";
import { useMediaQuery } from "@/hooks/use-media-query";

export function Chat({ placeholder }: { placeholder?: string }) {
	const chatMessages = useSelector(
		(state: RootState) => state.room.chatMessages
	);
	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.room.playerId);
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
		<div className="flex flex-col lg:h-full relative z-30 gap-1.5">
			<div className="flex-1 overflow-hidden">
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
						"h-full mx-1 flex gap-3 break-all flex-col items-start justify-start overflow-y-auto overflow-x-hidden scrollbar-hide",
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
			<div className="mt-1.5 w-full hidden sm:block">
				<ChatForm isGuessing={isGuessing} placeholder={placeholder} />
			</div>
			<div className="w-full sm:hidden">
				<VirtualKeyboard isGuessing={isGuessing} className="w-full" />
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
	const playerId = useSelector((state: RootState) => state.room.playerId);

	if (message.type === ChatMessageType.System) {
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
					{message.content}
				</span>
			</motion.li>
		);
	}

	if (!player) return null;

	const isOwnMessage = playerId === message.playerId;

	if (message.type === ChatMessageType.Default) {
		return (
			<ChatMessageWrapper message={message} player={player}>
				<div
					className={cn(
						"bg-background border-2 relative z-10 font-semibold flex overflow-hidden w-full max-w-full",
						isOwnMessage
							? "rounded-lg rounded-br-none"
							: "rounded-lg rounded-tl-none"
					)}
				>
					<span className="px-3 py-2 break-words overflow-wrap-anywhere w-full">
						{message.content}
					</span>
				</div>
			</ChatMessageWrapper>
		);
	}

	if (message.type === ChatMessageType.CloseGuess) {
		return (
			<ChatMessageWrapper message={message} player={player}>
				<div
					className={cn(
						"bg-background border-2 relative z-10 font-semibold flex overflow-hidden w-full max-w-full",
						isOwnMessage
							? "rounded-lg rounded-br-none"
							: "rounded-lg rounded-tl-none"
					)}
				>
					<div
						className={cn(
							"w-1.5 bg-blue-500 ml-auto",
							isOwnMessage && "order-2"
						)}
					/>
					<span className="px-3 py-2 break-words overflow-wrap-anywhere w-full">
						{message.content}
					</span>
				</div>
			</ChatMessageWrapper>
		);
	}

	if (message.type === ChatMessageType.Correct) {
		return (
			<ChatMessageWrapper message={message} player={player}>
				<div
					className={cn(
						"bg-background border-2 relative z-10 font-semibold flex overflow-hidden w-full max-w-full",
						isOwnMessage
							? "rounded-lg rounded-br-none"
							: "rounded-lg rounded-tl-none",
						isOwnMessage && "bg-[#40FF00]"
					)}
				>
					<span className="px-3 py-2 break-words overflow-wrap-anywhere w-full">
						{isOwnMessage ? "You guessed it!" : "Guessed it!"}
					</span>
					{!isOwnMessage && (
						<div className={cn("w-1.5 bg-green-500 ml-auto")} />
					)}
				</div>
			</ChatMessageWrapper>
		);
	}
}

function ChatMessageWrapper({
	message,
	player,
	children,
}: {
	message: ChatMessage;
	player: Player;
	children: React.ReactNode;
}) {
	const playerId = useSelector((state: RootState) => state.room.playerId);
	const { avatarConfig, username } = player;
	const avatarSvg = generateAvatar(avatarConfig);
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
				alt={username + " profile picture"}
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
						{username}{" "}
						{isOwnMessage && (
							<span className="text-xs text-foreground/50 px-0.5">(You)</span>
						)}
					</p>
				</div>
				<div className="w-full relative">
					{children}
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
export function ChatForm({
	isGuessing,
	placeholder,
}: {
	isGuessing?: boolean;
	placeholder?: string;
}) {
	const dispatch = useDispatch();
	const [messageHistory, setMessageHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [currentMessage, setCurrentMessage] = useState("");

	const selectedWord = useSelector(
		(state: RootState) => state.game.selectedWord
	);

	const hasNotGuessedAlready = selectedWord?.value.includes("*");

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
			dispatch({ type: "room/newChatMessage", payload: trimmedMessage });
			form.reset();
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="message"
					render={({ field }) => {
						const length = field.value.length;
						return (
							<FormItem className="relative space-y-0">
								<FormControl>
									<div className="flex items-center gap-3 relative px-0.5">
										<RaisedInput
											autoComplete="off"
											placeholder={placeholder}
											onKeyDown={handleKeyDown}
											{...field}
											onChange={(e) => {
												field.onChange(e);
												if (historyIndex === -1) {
													setCurrentMessage(e.target.value);
												}
											}}
											className="pr-10"
										/>
										{field.value.length > 0 &&
											isGuessing &&
											hasNotGuessedAlready && (
												<div
													className={cn(
														"absolute right-3 top-1/2 -translate-y-3/4 font-bold",
														length > (selectedWord?.value.length ?? 0) &&
															"text-red-500",
														length === selectedWord?.value.length &&
															"text-green-500",
														length < (selectedWord?.value.length ?? 0) &&
															"text-yellow-500"
													)}
												>
													{length}
												</div>
											)}
									</div>
								</FormControl>
							</FormItem>
						);
					}}
				></FormField>
			</form>
		</Form>
	);
}
