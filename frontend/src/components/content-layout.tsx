import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Doodle } from "./doodle/doodle";
import { Header } from "./header";
export function ContentLayout({
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
			<Header />

			<Doodle
				key="rain-cloud-1"
				className="lg:top-[20%] top-[10%] lg:left-[12%] left-[6%] absolute w-32 hidden lg:block"
				src="/doodles/rain-cloud.png"
			/>
			<Doodle
				className="hidden lg:block bottom-[10%] right-[14%] absolute h-28"
				key="rain-cloud-2"
				style={{ top: "10%", right: "10%" }}
				src="/doodles/rain-cloud.png"
			/>

			<Card className="max-w-4xl mx-auto my-10 relative z-40">
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
