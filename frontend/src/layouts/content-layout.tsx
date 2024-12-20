import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { ModalMenu } from "@/components/ui/modal-menu";
import { Logo } from "@/components/ui/logo";
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
		<div className="max-h-[100dvh] overflow-y-auto">
			<div className="sticky z-50 top-0 py-4 w-full flex justify-between items-center  px-4 bg-background-secondary">
				<Logo className="w-36" />
				<ModalMenu />
			</div>
			<BobbingDoodle
				key="rain-cloud-1"
				className="lg:top-[20%] top-[10%] lg:left-[12%] left-[6%] absolute w-32 hidden lg:block"
				src="/doodles/rain-cloud.png"
			/>
			<BobbingDoodle
				className="hidden lg:block bottom-[10%] right-[14%] absolute h-28"
				key="rain-cloud-2"
				style={{ top: "10%", right: "10%" }}
				src="/doodles/rain-cloud.png"
			/>
			<div className="px-2 pb-2">
				<Card className="max-w-4xl mx-auto relative z-40">
					<CardContent className="p-6">
						<div className="prose prose-slate max-w-none ">
							<h1 className="text-3xl font-bold mb-2">{title}</h1>
							<p className="text-sm text-gray-500 mb-6">
								Last updated: {lastUpdated}
							</p>
							{children}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
