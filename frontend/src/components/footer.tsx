import { Link } from "react-router";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export function Footer() {
	return (
		<footer className="absolute bottom-5 left-0 right-0 p-3 flex justify-between items-center">
			<div className="flex w-full justify-center h-auto items-center flex-wrap gap-y-2 lg:h-3">
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
				<Separator orientation="vertical" className="hidden sm:block" />
				<a
					href="https://walagames.com"
					target="_blank"
					className="flex items-center text-muted-foreground gap-1 text-sm px-3"
				>
					Developed by{" "}
					<Button
						size="sm"
						variant="link"
						className="text-muted-foreground gap-1 px-0"
					>
						<img loading="eager" src="/walagames.png" className="h-6 w-6 inline-block" />
						walagames
					</Button>
				</a>
			</div>
		</footer>
	);
}
