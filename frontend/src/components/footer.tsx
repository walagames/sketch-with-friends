import { Link } from "react-router";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export function Footer() {
	return (
		<footer className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end">
			{/* <p className="text-sm text-black flex items-center gap-1">
				Built with ❤️ by the <img src="/walagames.png" className="h-6" />
				<a href="https://github.com/walagames" target="_blank">
					<Button size="sm" className="px-0" variant="link">
						walagames
					</Button>
				</a>{" "}
				team
			</p> */}
			<a href="https://walagames.com" target="_blank">
				<img
					alt="Wala Games Logo"
					src="/walagames.webp"
					className="h-12 grayscale"
				/>
			</a>
			<div className="flex absolute left-1/2 -translate-x-1/2 h-3 items-center my-3">
				<Link to="/how-to-play">
					<Button size="sm" variant="link" className="text-muted-foreground">
						How to play
					</Button>
				</Link>
				<Separator orientation="vertical" />
				<a href="mailto:contact@walagames.com">
					<Button size="sm" variant="link" className="text-muted-foreground">
						Contact
					</Button>
				</a>
				<Separator orientation="vertical" />
				<Link to="/privacy-policy">
					<Button size="sm" variant="link" className="text-muted-foreground">
						Privacy Policy
					</Button>
				</Link>
				<Separator orientation="vertical" />
				<Link to="/terms-of-service">
					<Button size="sm" variant="link" className="text-muted-foreground">
						Terms of Service
					</Button>
				</Link>
			</div>
		</footer>
	);
}
