import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RoomProvider } from "@/components/room/room-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Sketch with Friends",
	description: "An interactive drawing game",
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
				<Toaster
					className="Toaster"
					toastOptions={{
						classNames: {
							toast: "px-4 py-2 rounded-full",
						},
					}}
					richColors
					position="top-center"
				/>
			</body>
		</html>
	);
}
