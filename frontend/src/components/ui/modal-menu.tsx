import { Menu } from "lucide-react";
import { Link } from "react-router";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogHeader,
	DialogTrigger,
} from "./dialog";
import { RaisedButton } from "./raised-button";
import React from "react";

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
					<DialogTitle>Menu</DialogTitle>
					<DialogDescription>
						Select an option below to continue.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<Link to="/" onClick={handleClick}>
						<RaisedButton size="wide" className="text-xl">
							Home
						</RaisedButton>
					</Link>

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
