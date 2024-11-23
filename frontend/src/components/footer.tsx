import { Link } from "react-router";
import { Button } from "./ui/button";

export function Footer() {
	return (
		<footer className="absolute bottom-0 left-0 right-0 px-3 py-2 flex justify-between items-end">
			<p className="text-sm text-black flex items-center gap-1">
				Built with ❤️ by <img alt="" src="/walagames.png" className="h-6" />
				<a href="https://github.com/walagames" target="_blank">
					<Button size="sm" className="px-0" variant="link">
						walagames
					</Button>
				</a>{" "}
			</p>
			<div className="flex">
				<Link to="/terms-of-service">
					<Button size="sm" variant="link">
						Terms of Service
					</Button>
				</Link>
				<Link to="/privacy-policy">
					<Button size="sm" variant="link">
						Privacy Policy
					</Button>
				</Link>
				<a href="mailto:contact@walagames.com">
					<Button size="sm" variant="link">
						Contact
					</Button>
				</a>
			</div>
		</footer>
	);
}
