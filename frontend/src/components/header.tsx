import { Link } from "react-router";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Logo } from "./logo";

export function Header() {
	return (
		<header className="flex p-6 sticky top-0 left-0 right-0 justify-between items-center bg-[#aef1fe] z-50">
			<Logo className="w-32" />
			<div className="flex h-3 items-center">
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
		</header>
	);
}
