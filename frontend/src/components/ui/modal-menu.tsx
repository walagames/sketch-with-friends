import { Menu } from "lucide-react";
import { Link } from "react-router";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogHeader,
	DialogTrigger,
} from "./dialog";
import { RaisedButton } from "./raised-button";
import React from "react";
import { VolumeControls } from "./volume-controls";
import { Logo } from "../logo";

export function ModalMenu() {
	const [open, setOpen] = React.useState(false);

	const handleClick = () => setOpen(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<RaisedButton size="icon" variant="action">
					<Menu className="size-5 -translate-y-0.5" />
				</RaisedButton>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md border-4 border-secondary-foreground bg-[#aef1fe]">
				<DialogHeader>
					<DialogTitle>
						<Logo className="w-44 py-1 mx-auto" />
					</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<Link to="/" onClick={handleClick}>
						<RaisedButton size="wide" className="text-xl">
							Home
						</RaisedButton>
					</Link>

					<VolumeControls />

					<Link to="/how-to-play" onClick={handleClick}>
						<RaisedButton size="wide" className="text-xl">
							How to Play
						</RaisedButton>
					</Link>

					<Link to="/terms-of-service" onClick={handleClick}>
						<RaisedButton size="wide" className="text-xl">
							Terms of Service
						</RaisedButton>
					</Link>

					<Link to="/privacy-policy" onClick={handleClick}>
						<RaisedButton size="wide" className="text-xl">
							Privacy Policy
						</RaisedButton>
					</Link>

					<a href="mailto:contact@walagames.com" onClick={handleClick}>
						<RaisedButton size="wide" className="text-xl">
							Contact
						</RaisedButton>
					</a>
				</div>
			</DialogContent>
		</Dialog>
	);
}
