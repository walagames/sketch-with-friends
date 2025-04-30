"use client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { RaisedButton } from "@/components/ui/raised-button";
import { SoundProvider } from "@/providers/sound-provider";
import { store } from "@/state/store";
import { Provider } from "react-redux";

export default function Home() {
	return (
		<div className="flex flex-col min-h-screen overflow-hidden">
			{/* Animated background */}
			<div className="fixed inset-0 -z-10">
				<div className="absolute top-0 right-0 w-[80%] h-[40%] bg-gradient-to-l from-primary/20 to-transparent opacity-30 blur-[100px] rounded-full"></div>
				<div className="absolute bottom-0 left-0 w-[60%] h-[50%] bg-gradient-to-r from-hills/20 to-transparent opacity-30 blur-[100px] rounded-full"></div>
				<div className="absolute top-1/2 left-1/4 w-[40%] h-[40%] bg-gradient-to-br from-[#ff9d80]/10 to-transparent opacity-30 blur-[100px] rounded-full"></div>
			</div>

			{/* Header */}
			<Provider store={store}>
				<SoundProvider>
					<header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/30">
						<div className="container flex items-center justify-between h-16 mx-auto">
							<Link href="/" className="flex items-center gap-2">
								<Logo className="w-32" />
							</Link>
							<nav className="hidden md:flex items-center gap-6">
								<Link
									href="/how-to-play"
									className="text-sm font-medium hover:text-primary transition-colors"
								>
									How to Play
								</Link>
								<Link href="/play">
									<RaisedButton variant="action">
										Play
									</RaisedButton>
								</Link>
							</nav>
							<Link href="/play" className="md:hidden">
								<RaisedButton variant="action">Play</RaisedButton>
							</Link>
						</div>
					</header>
				</SoundProvider>
			</Provider>
			{/* Hero Section */}
			<section className="relative py-20 md:py-28">
				<div className="container flex flex-col lg:flex-row items-center gap-8 px-4 md:px-6 mx-auto">
					<div className="flex-1 space-y-6 text-center lg:text-left">
						<h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
							Draw, Guess,{" "}
							<span className="bg-clip-text">
								Win!
							</span>
						</h1>
						<p className="text-lg text-muted-foreground max-w-[600px] mx-auto lg:mx-0">
							The ultimate multiplayer drawing and guessing game. Challenge
							friends and players worldwide to guess your drawings!
						</p>
						<div className="flex flex-wrap gap-4 justify-center lg:justify-start">
							<Link href="/play">
								<Button
									size="lg"
									className="h-12 px-8 font-medium shadow-accent-sm"
								>
									Start Playing
								</Button>
							</Link>
							<Link href="/how-to-play">
								<Button
									variant="outline"
									size="lg"
									className="h-12 px-8 font-medium"
								>
									Learn How
								</Button>
							</Link>
						</div>
					</div>
					<div className="flex-1 relative aspect-square max-w-md">
						<div className="absolute inset-0 flex items-center justify-center animate-float">
							<div className="relative w-full h-full">
								{/* Canvas mockup */}
								<div className="absolute inset-0 bg-white rounded-2xl shadow-accent-md rotate-3 overflow-hidden">
									<svg
										viewBox="0 0 400 400"
										className="w-full h-full stroke-primary stroke-2"
									>
										<circle cx="200" cy="140" r="70" fill="none" />
										<line x1="200" y1="210" x2="200" y2="300" strokeWidth="5" />
										<line x1="200" y1="300" x2="140" y2="380" strokeWidth="5" />
										<line x1="200" y1="300" x2="260" y2="380" strokeWidth="5" />
										<line x1="140" y1="250" x2="260" y2="250" strokeWidth="5" />
									</svg>
								</div>
								<div className="absolute top-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-primary/10 text-sm font-bold tracking-widest">
									STICK FIGURE
								</div>
								{/* Chat bubbles */}
								<div className="absolute -right-8 -bottom-12 transform rotate-6 bg-white p-3 rounded-xl shadow-sm border border-border/50">
									<p className="text-sm font-medium">It's a person!</p>
								</div>
								<div className="absolute -left-10 bottom-0 transform -rotate-3 bg-primary text-white p-3 rounded-xl shadow-sm">
									<p className="text-sm font-medium">Stick figure!</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="relative py-16 bg-card/50">
				<div className="container px-4 md:px-6 mx-auto">
					<div className="flex flex-col items-center text-center mb-12">
						<div className="inline-block mb-4 px-4 py-1.5 bg-primary/10 rounded-full">
							<span className="text-sm font-medium text-primary">
								Game Features
							</span>
						</div>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
							Creative Drawing, Competitive Guessing
						</h2>
						<p className="max-w-[600px] text-muted-foreground">
							Unleash your creativity and challenge your wit in this fast-paced,
							engaging multiplayer game.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<FeatureCard
							icon={<PencilIcon />}
							title="Draw & Express"
							description="Show off your artistic skills with intuitive drawing tools. Make your mark and express yourself!"
						/>
						<FeatureCard
							icon={<PeopleIcon />}
							title="Play Together"
							description="Create private rooms with friends or join public games with players around the world."
						/>
						<FeatureCard
							icon={<DevicesIcon />}
							title="Play Anywhere"
							description="Works on any device. Pick up your phone, tablet or computer and start sketching."
						/>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className="py-20 relative">
				<div className="container px-4 md:px-6 mx-auto">
					<div className="flex flex-col items-center text-center mb-16">
						<div className="inline-block mb-4 px-4 py-1.5 bg-primary/10 rounded-full">
							<span className="text-sm font-medium text-primary">
								How It Works
							</span>
						</div>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
							Simple, Fun, Addictive
						</h2>
						<p className="max-w-[600px] text-muted-foreground">
							Get started in seconds and dive into endless rounds of creative
							drawing and clever guessing.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-12">
						<StepCard
							number="01"
							title="Join or Create"
							description="Start a new game room or join an existing one with a room code."
						/>
						<StepCard
							number="02"
							title="Draw & Guess"
							description="Take turns drawing from given words while others race to guess correctly."
						/>
						<StepCard
							number="03"
							title="Score & Win"
							description="Earn points for quick guesses and well-drawn art that others can identify."
						/>
					</div>
				</div>
			</section>

			{/* Game Preview Section */}
			<section className="py-20 bg-gradient-to-b from-background to-card/50">
				<div className="container px-4 md:px-6 mx-auto">
					<div className="flex flex-col lg:flex-row items-center gap-16">
						<div className="flex-1 order-2 lg:order-1">
							<div className="relative flex justify-center">
								<div className="w-full max-w-lg bg-background rounded-xl overflow-hidden shadow-accent-sm border border-border/50">
									<div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-background">
										<div className="flex items-center gap-2">
											<div className="w-2 h-2 rounded-full bg-[#ff5f57]"></div>
											<div className="w-2 h-2 rounded-full bg-[#febc2e]"></div>
											<div className="w-2 h-2 rounded-full bg-[#28c840]"></div>
										</div>
										<div className="text-xs font-mono text-muted-foreground">
											sketch-with-friends.com
										</div>
										<div></div>
									</div>
									<div className="aspect-[4/3] bg-white p-4 relative">
										<svg className="w-full h-full" viewBox="0 0 400 300">
											<path
												d="M170,40 Q200,10 230,40 Q260,70 230,100 Q200,130 170,100 Q140,70 170,40"
												fill="none"
												stroke="#6637EE"
												strokeWidth="5"
											/>
											<line
												x1="200"
												y1="100"
												x2="200"
												y2="200"
												stroke="#6637EE"
												strokeWidth="5"
											/>
											<line
												x1="150"
												y1="150"
												x2="250"
												y2="150"
												stroke="#6637EE"
												strokeWidth="5"
											/>
											<line
												x1="200"
												y1="200"
												x2="150"
												y2="250"
												stroke="#6637EE"
												strokeWidth="5"
											/>
											<line
												x1="200"
												y1="200"
												x2="250"
												y2="250"
												stroke="#6637EE"
												strokeWidth="5"
											/>
										</svg>
										<div className="absolute top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gray-100 rounded-full text-sm font-medium">
											STICK FIGURE
										</div>
									</div>
									<div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
										<div className="w-6 h-6 rounded-full bg-primary"></div>
										<div className="w-6 h-6 rounded-full bg-[#ff5252]"></div>
										<div className="w-6 h-6 rounded-full bg-[#4caf50]"></div>
										<div className="w-6 h-6 rounded-full bg-[#2196f3]"></div>
										<div className="w-6 h-6 rounded-full bg-[#ffeb3b]"></div>
										<div className="h-6 w-[1px] bg-gray-300 mx-1"></div>
										<div className="w-6 h-1.5 rounded-full bg-gray-400"></div>
										<div className="w-5 h-3 rounded bg-gray-400"></div>
									</div>
								</div>

								{/* Chat Overlay */}
								<div className="absolute -bottom-10 -right-8 max-w-[180px] bg-white p-3 rounded-lg shadow-md border border-border/50 transform rotate-2">
									<p className="text-sm">I think it's a stick figure!</p>
								</div>
								<div className="absolute -bottom-6 -left-10 max-w-[160px] bg-white p-3 rounded-lg shadow-md border border-border/50 transform -rotate-3">
									<p className="text-sm">Looks like a person...</p>
								</div>
							</div>
						</div>
						<div className="flex-1 space-y-6 text-center lg:text-left order-1 lg:order-2">
							<h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
								See the Game in Action
							</h2>
							<p className="text-muted-foreground">
								Take turns drawing while others guess. Be the fastest to guess
								or create the most recognizable drawings to win!
							</p>
							<div className="flex flex-wrap gap-4 justify-center lg:justify-start">
								<Link href="/play">
									<Button className="shadow-accent-sm">Play Now</Button>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials/User Stats */}
			<section className="py-16 bg-card/30">
				<div className="container px-4 md:px-6 mx-auto">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
						<StatCard value="1M+" label="Players" />
						<StatCard value="5M+" label="Games Played" />
						<StatCard value="50M+" label="Drawings Created" />
						<StatCard value="100+" label="Countries" />
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20">
				<div className="container px-4 md:px-6 mx-auto">
					<div className="relative overflow-hidden rounded-3xl bg-primary">
						<div className="absolute inset-0 mix-blend-overlay opacity-10">
							<svg className="w-full h-full" viewBox="0 0 600 400">
								<rect x="150" y="100" width="100" height="100" fill="#fff" />
								<circle cx="350" cy="150" r="50" fill="#fff" />
								<path d="M450,250 L500,350 L400,350 Z" fill="#fff" />
								<line
									x1="100"
									y1="300"
									x2="200"
									y2="200"
									stroke="#fff"
									strokeWidth="10"
								/>
							</svg>
						</div>
						<div className="relative p-8 md:p-12 lg:p-16 text-center">
							<h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
								Ready to Start Sketching?
							</h2>
							<p className="text-primary-foreground/90 max-w-[600px] mx-auto mb-8">
								Join thousands of players already having fun with Sketch with
								Friends
							</p>
							<Link href="/play">
								<Button
									size="lg"
									variant="secondary"
									className="bg-white text-primary font-medium px-8 hover:bg-white/90"
								>
									Play Now
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border/50 bg-card/30 py-10">
				<div className="container px-4 md:px-6 mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
						<div className="md:col-span-2">
							<Link href="/" className="flex items-center gap-2 mb-4">
								<Logo className="w-36" />
							</Link>
							<p className="text-sm text-muted-foreground max-w-xs">
								A free multiplayer drawing and guessing game. Have fun with your
								friends and players worldwide!
							</p>
						</div>
						<div>
							<h3 className="text-sm font-medium mb-3">Play</h3>
							<ul className="space-y-2">
								<li>
									<Link
										href="/play"
										className="text-sm text-muted-foreground hover:text-foreground transition"
									>
										Start Game
									</Link>
								</li>
								<li>
									<Link
										href="/how-to-play"
										className="text-sm text-muted-foreground hover:text-foreground transition"
									>
										How to Play
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="text-sm font-medium mb-3">Legal</h3>
							<ul className="space-y-2">
								<li>
									<Link
										href="/privacy-policy"
										className="text-sm text-muted-foreground hover:text-foreground transition"
									>
										Privacy Policy
									</Link>
								</li>
								<li>
									<Link
										href="/terms-of-service"
										className="text-sm text-muted-foreground hover:text-foreground transition"
									>
										Terms of Service
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="text-sm font-medium mb-3">Social</h3>
							<div className="flex gap-4">
								<a
									href="https://twitter.com"
									className="text-muted-foreground hover:text-foreground transition"
								>
									<TwitterIcon className="h-5 w-5" />
								</a>
								<a
									href="https://github.com"
									className="text-muted-foreground hover:text-foreground transition"
								>
									<GitHubIcon className="h-5 w-5" />
								</a>
							</div>
						</div>
					</div>
					<div className="border-t border-border/50 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
						<p className="text-xs text-muted-foreground">
							© {new Date().getFullYear()} Sketch with Friends. All rights
							reserved.
						</p>
						<p className="text-xs text-muted-foreground">
							Made with ❤️ by the Sketch with Friends team
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}

// Components
function FeatureCard({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="bg-background rounded-xl p-6 shadow-accent-sm border border-border/30 transition-all hover:shadow-accent hover:-translate-y-1">
			<div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
				{icon}
			</div>
			<h3 className="font-medium text-xl mb-2">{title}</h3>
			<p className="text-muted-foreground text-sm">{description}</p>
		</div>
	);
}

function StepCard({
	number,
	title,
	description,
}: {
	number: string;
	title: string;
	description: string;
}) {
	return (
		<div className="flex flex-col items-center text-center">
			<div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl mb-6">
				{number}
			</div>
			<h3 className="font-medium text-xl mb-2">{title}</h3>
			<p className="text-muted-foreground text-sm max-w-xs">{description}</p>
		</div>
	);
}

function StatCard({ value, label }: { value: string; label: string }) {
	return (
		<div className="space-y-2">
			<div className="text-3xl md:text-4xl font-extrabold text-primary">
				{value}
			</div>
			<div className="text-sm text-muted-foreground font-medium">{label}</div>
		</div>
	);
}

// Icons
function PencilIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
		</svg>
	);
}

function PeopleIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
			<circle cx="9" cy="7" r="4"></circle>
			<path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
			<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
		</svg>
	);
}

function DevicesIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect width="16" height="10" x="4" y="3" rx="2"></rect>
			<path d="M7 13h10"></path>
			<path d="M9 21h6"></path>
			<path d="M12 13v8"></path>
		</svg>
	);
}

function TwitterIcon({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
		</svg>
	);
}

function GitHubIcon({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
			<path d="M9 18c-4.51 2-5-2-7-2"></path>
		</svg>
	);
}
