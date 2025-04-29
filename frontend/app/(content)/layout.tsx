"use client";
import React from "react";
// Assuming these components exist in frontend, adjust paths as needed
import { Card, CardContent } from "@/components/ui/card";
import { ModalMenu } from "@/components/ui/modal-menu";
import { Logo } from "@/components/ui/logo";
import Link from "next/link"; // Use Next.js Link
// import { RainCloudDoodle } from "@/components/doodle/rain-cloud-doodle"; // Commenting out doodle for now

// TODO: Define these props or fetch them dynamically
const title = "Content Page"; // Placeholder
const lastUpdated = "November 24, 2024"; // Placeholder

export default function ContentLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="max-h-[100dvh] overflow-y-auto">
			<div className="sticky z-50 top-0 py-4 w-full flex justify-between items-center px-4 bg-background-secondary">
				<Link href="/">
					{/* Ensure Logo component doesn't require router props */}
					<Logo className="w-36" />
				</Link>
				{/* Ensure ModalMenu component doesn't require router props */}
				<ModalMenu />
			</div>
			{/*
            // Commenting out doodles until component is confirmed/migrated
			<RainCloudDoodle
				key="rain-cloud-1"
				duration={5}
				className="lg:top-[20%] top-[10%] lg:left-[12%] left-[6%] absolute w-32 hidden lg:block"
				src="/doodles/rain-cloud.png"
			/>
			<RainCloudDoodle
				duration={4}
				className="hidden lg:block bottom-[10%] right-[14%] absolute h-28"
				key="rain-cloud-2"
				style={{ top: "10%", right: "10%" }}
				src="/doodles/rain-cloud.png"
			/>
            */}
			<div className="px-2 pb-2">
				<Card className="max-w-4xl mx-auto relative z-40">
					<CardContent className="p-6">
						{/* Apply prose styles via globals.css or a wrapper component */}
						<div className="prose prose-slate max-w-none">
							<h1 className="text-3xl font-bold mb-2">{title}</h1>
							{/* This title/date might be better handled per-page */}
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
