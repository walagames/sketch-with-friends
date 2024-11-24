import { Link } from "react-router";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export function Footer() {
	return (
		<footer className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-center">
			<a
				href="https://walagames.com"
				target="_blank"
				className="hidden sm:block"
			>
				<img
					alt="Wala Games Logo"
					src="/walagames.webp"
					className="h-12 grayscale"
				/>
			</a>
			<div className="flex w-full sm:w-auto justify-center sm:absolute sm:left-1/2 sm:-translate-x-1/2 h-auto items-center my-4 flex-wrap gap-y-2 lg:h-3">
				<Link to="/how-to-play">
					<Button size="sm" variant="link" className="text-muted-foreground">
						How to play
					</Button>
				</Link>
				<Separator orientation="vertical" className="hidden sm:block" />
				<a href="mailto:contact@walagames.com">
					<Button size="sm" variant="link" className="text-muted-foreground">
						Contact
					</Button>
				</a>
				<Separator orientation="vertical" className="hidden sm:block" />
				<Link to="/privacy-policy">
					<Button size="sm" variant="link" className="text-muted-foreground">
						Privacy Policy
					</Button>
				</Link>
				<Separator orientation="vertical" className="hidden sm:block" />
				<Link to="/terms-of-service">
					<Button size="sm" variant="link" className="text-muted-foreground">
						Terms of Service
					</Button>
				</Link>
			</div>
		</footer>
	);
}
