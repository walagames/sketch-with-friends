import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RoomProvider } from "@/components/room-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Sketch with Friends",
	description: "An interactive drawing game with friends",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<RoomProvider>{children}</RoomProvider>
			</body>
		</html>
	);
}
