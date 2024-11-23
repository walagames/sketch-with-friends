import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "./logo";
import { Link } from "react-router";
import { Button } from "./ui/button";
export function PolicyLayout({
	children,
	title,
	lastUpdated,
}: {
	children: React.ReactNode;
	title: string;
	lastUpdated: string;
}) {
	return (
		<div className="max-h-[100dvh] overflow-y-auto ">
			<div className="flex p-6 sticky top-0 left-0 right-0 justify-between items-center bg-[#aef1fe]">
				<Logo className="w-32" />
				<div className="flex">
					<Link to="/">
						<Button size="sm" variant="link">
							Home
						</Button>
					</Link>
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
			</div>

			<Card className="max-w-4xl mx-auto my-6">
				<CardContent className="p-6">
					<div className="prose prose-slate max-w-none">
						<h1 className="text-3xl font-bold mb-2">{title}</h1>
						<p className="text-sm text-gray-500 mb-6">
							Last updated: {lastUpdated}
						</p>
						{children}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
