import { motion } from "framer-motion";
import { generateAvatar } from "@/lib/avatar";
import { Player, RoomRole, changePlayerProfile } from "@/state/features/room";
import { forwardRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/state/store";
import { CrownIcon } from "@/components/ui/icons";
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
import { PlayerInfoForm } from "@/components/views/join-room/player-info-form";
import { RaisedButton } from "@/components/ui/raised-button";
import { PlayerProfile } from "@/state/features/room";
import { containerSpring } from "@/config/spring";
import { SoundEffect, useSound } from "@/providers/sound-provider";

function CardContent({
	player,
	isCurrentPlayer,
}: {
	player: Player;
	isCurrentPlayer: boolean;
}) {
	return (
		<RaisedButton variant="card" size="card" className="w-full justify-start">
			<div className="flex items-center h-14 -translate-y-0.5 lg:w-64 min-h-0 flex-1">
				<img
					className="rounded-l-lg h-full aspect-square relative"
					src={generateAvatar(player.profile.avatarSeed)}
				/>
				<p className="text-xl leading-0 font-bold truncate pl-4 translate-y-0.5">
					{player.profile.name}
				</p>
				{isCurrentPlayer && (
					<p className="text-lg text-foreground/50 leading-0 font-bold px-2 pr-4 translate-y-0.5">
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
		const { roomRole } = player;
		const playerId = useSelector((state: RootState) => state.client.id);
		const isCurrentPlayer = playerId === player.id;
		const [isEditPlayerOptionsOpen, setIsEditPlayerOptionsOpen] =
			useState(false);

		const playSound = useSound();

		const handleSubmit = (profile: PlayerProfile) => {
			setIsEditPlayerOptionsOpen(false);
			dispatch(
				changePlayerProfile({
					id: player.id,
					name: profile.name,
					avatarSeed: profile.avatarSeed,
					avatarColor: profile.avatarColor,
				})
			);
		};

		return (
			<div
				className="flex items-start gap-4 w-full ml-auto lg:w-auto px-1"
				ref={ref}
			>
				{roomRole === RoomRole.Host && (
					<div className="translate-y-2.5">
						<CrownIcon className="w-8 h-8 text-yellow-400" />
					</div>
				)}
				<motion.div
					layout
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={containerSpring}
					className="w-[calc(100%-3rem)] ml-auto lg:w-auto"
				>
					{isCurrentPlayer ? (
						<DropdownMenu modal={false}>
							<DropdownMenuTrigger className="w-full">
								<CardContent
									player={player}
									isCurrentPlayer={isCurrentPlayer}
								/>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-60 translate-x-1">
								<DropdownMenuLabel>
									<p className="font-bold">{player.profile.name}</p>
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
	handleSubmit: (profile: PlayerProfile) => void;
}) {
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent
				className="sm:max-w-sm border-4 border-secondary-foreground bg-background-secondary"
				aria-describedby="edit-player-description"
			>
				<DialogHeader>
					<DialogTitle>Edit profile</DialogTitle>
				</DialogHeader>
				<div className="my-6 flex flex-col items-center">
					<PlayerInfoForm
						handleSubmit={handleSubmit}
						defaultValues={{
							name: player.profile.name,
							avatarSeed: player.profile.avatarSeed,
							avatarColor: player.profile.avatarColor,
						}}
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
