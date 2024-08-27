import type { Metadata } from "next";
import "./globals.css";
import { RoomProvider } from "@/components/room/room-provider";
import { Toaster } from "@/components/ui/sonner";
import { DM_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
const dmsans = DM_Sans({ subsets: ["latin"] });
export const metadata: Metadata = {
	title: "Sketch with Friends",
	description: "An interactive multiplayer drawing game",
};
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={cn(dmsans.className, "bg-secondary")}>
				<RoomProvider>{children}</RoomProvider>
				<Toaster
					offset={16}
					className="Toaster"
					toastOptions={{
						classNames: {
							toast: "px-4 py-2 ",
						},
					}}
					position="top-center"
				/>
			</body>
		</html>
	);
}
