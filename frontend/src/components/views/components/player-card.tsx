import { motion } from "framer-motion";
import { AvatarConfig, generateAvatar } from "@/lib/avatar";
import { Player, changePlayerProfile } from "@/state/features/room";
import { forwardRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/state/store";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { PlayerInfoForm } from "@/components/views/components/player-info-form";
import { RaisedButton } from "@/components/ui/raised-button";
import { containerSpring } from "@/config/spring";
import { SoundEffect, useSound } from "@/providers/sound-provider";
import { changeAvatarConfig, changeUsername } from "@/state/features/client";

function CardContent({
	player,
	isCurrentPlayer,
}: {
	player: Player;
	isCurrentPlayer: boolean;
}) {
	return (
		<RaisedButton variant="card" size="card" className="w-full justify-start">
			<div className="flex items-center h-14 -translate-y-0.5 lg:w-64 min-h-0 flex-1 relative">
				<img
					alt="Player avatar"
					className="rounded-l-lg h-full aspect-square relative"
					src={generateAvatar(player.avatarConfig)}
				/>
				<p className="text-xl leading-0 font-bold truncate pl-2 translate-y-0.5">
					{player.username}
				</p>
				{isCurrentPlayer && (
					<p className="text-sm text-foreground/50 leading-0 font-bold px-1 translate-y-0.5">
						(You)
					</p>
				)}
			</div>
		</RaisedButton>
	);
}

export const PlayerCard = forwardRef<HTMLDivElement, { player: Player }>(
	({ player }, ref) => {
		const dispatch = useDispatch();
		const playerId = useSelector((state: RootState) => state.room.playerId);
		const isCurrentPlayer = playerId === player.id;
		const [isEditPlayerOptionsOpen, setIsEditPlayerOptionsOpen] =
			useState(false);

		const playSound = useSound();

		const handleSubmit = (profile: {
			username: string;
			avatarConfig: AvatarConfig;
		}) => {
			setIsEditPlayerOptionsOpen(false);
			dispatch(
				changePlayerProfile({
					id: player.id,
					username: profile.username,
					avatarConfig: profile.avatarConfig,
				})
			);
		};

		return (
			<div className="flex items-start gap-2 w-full" ref={ref}>
				<motion.div
					layout
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={containerSpring}
					className="w-full"
				>
					{isCurrentPlayer ? (
						<DropdownMenu modal={false}>
							<DropdownMenuTrigger className="w-full flex">
								<CardContent
									player={player}
									isCurrentPlayer={isCurrentPlayer}
								/>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-60 translate-x-1">
								<DropdownMenuLabel>
									<p className="font-bold">{player.username}</p>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<DropdownMenuItem
										onSelect={() => {
											playSound(SoundEffect.CLICK);
											setIsEditPlayerOptionsOpen(true);
										}}
									>
										Edit profile
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<CardContent player={player} isCurrentPlayer={isCurrentPlayer} />
					)}
				</motion.div>
				<EditPlayerInfoModal
					key={player.id + "edit-modal"}
					isOpen={isEditPlayerOptionsOpen}
					setIsOpen={setIsEditPlayerOptionsOpen}
					player={player}
					handleSubmit={handleSubmit}
				/>
			</div>
		);
	}
);

function EditPlayerInfoModal({
	isOpen,
	setIsOpen,
	player,
	handleSubmit,
}: {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	player: Player;
	handleSubmit: (profile: {
		username: string;
		avatarConfig: AvatarConfig;
	}) => void;
}) {
	const dispatch = useDispatch();
	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				setIsOpen(open);
				dispatch(changeAvatarConfig(player.avatarConfig));
				dispatch(changeUsername(player.username));
			}}
		>
			<DialogContent
				className="sm:max-w-sm border-4 border-secondary-foreground bg-zinc-100"
				aria-describedby="edit-player-description"
			>
				<DialogHeader>
					<DialogTitle>Edit profile</DialogTitle>
				</DialogHeader>
				<div className="my-6 flex flex-col items-center">
					<PlayerInfoForm
						handleSubmit={handleSubmit}
						bottomButton={
							<RaisedButton shift={false} variant="action" size="lg">
								Save
							</RaisedButton>
						}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
