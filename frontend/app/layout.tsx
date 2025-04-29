import type { Metadata } from "next";
import { Nokora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const nokora = Nokora({
	variable: "--font-nokora",
	subsets: ["latin"],
	weight: ["100", "300", "400", "700", "900"],
});

export const metadata: Metadata = {
	metadataBase: new URL("https://sketchwithfriends.com"),
	title: "Sketch with Friends - Free Multiplayer Drawing Game",
	description:
		"A free multiplayer game where you take turns drawing and guessing words with friends and players worldwide.",
	applicationName: "Sketch with Friends",
	openGraph: {
		title: "Sketch with Friends - Free Multiplayer Drawing Game",
		description:
			"A free multiplayer game where you take turns drawing and guessing words with friends and players worldwide.",
		url: "https://sketchwithfriends.com",
		siteName: "Sketch with Friends",
		images: [
			{
				url: "/og.png",
				width: 1200,
				height: 630,
				alt: "Sketch with Friends Logo",
			},
		],
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Sketch with Friends - Free Multiplayer Drawing Game",
		description:
			"A free multiplayer game where you take turns drawing and guessing words with friends and players worldwide.",
		images: ["/og.png"],
	},
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#aef1fe" },
		{ media: "(prefers-color-scheme: dark)", color: "#aef1fe" },
	],
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "any" },
			{ url: "/favicon.svg", type: "image/svg+xml" },
			{ url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
		],
		apple: "/apple-touch-icon.png",
	},
	manifest: "/site.webmanifest",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={cn(nokora.className, "antialiased")}>{children}</body>
		</html>
	);
}
