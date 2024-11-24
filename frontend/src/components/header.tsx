import { Link } from "react-router";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Logo } from "./logo";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Menu } from "lucide-react";

export function Header() {
	return (
		<header className="flex p-4 sticky top-0 left-0 right-0 justify-between items-center bg-[#aef1fe] z-50 -mx-2">
			<Logo className="w-28" />

			{/* Desktop Menu */}
			<div className="hidden sm:flex h-3 items-center">
				<Link to="/">
					<Button size="sm" variant="link">
						Home
					</Button>
				</Link>
				<Separator orientation="vertical" />
				<Link to="/how-to-play">
					<Button size="sm" variant="link">
						How to play
					</Button>
				</Link>
				<Separator orientation="vertical" />
				<Link to="/terms-of-service">
					<Button size="sm" variant="link">
						Terms of Service
					</Button>
				</Link>
				<Separator orientation="vertical" />
				<Link to="/privacy-policy">
					<Button size="sm" variant="link">
						Privacy Policy
					</Button>
				</Link>
				<Separator orientation="vertical" />
				<a href="mailto:contact@walagames.com">
					<Button size="sm" variant="link">
						Contact
					</Button>
				</a>
			</div>

			{/* Mobile Menu */}
			<div className="sm:hidden">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon">
							<Menu className="size-6" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuItem asChild>
							<Link to="/">Home</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link to="/how-to-play">How to play</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link to="/terms-of-service">Terms of Service</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link to="/privacy-policy">Privacy Policy</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<a href="mailto:contact@walagames.com">Contact</a>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
