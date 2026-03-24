// app/about/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/client/FadeIn";

export const metadata = {
	title: "About Daily Thoughts",
	description: "A personal blog about life, art, and everything in between.",
	keywords: ["about", "personal blog", "life", "art", "daily thoughts", "aman", "islamabad"],
	alternates: {
		canonical: "/about",
	},
};

export default function About() {
	return (
		<div className="container max-w-3xl mx-auto py-5 md:py-10 space-y-12">
			<FadeIn>
				<h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight md:text-center">
					About <span className="text-primary">Daily Thoughts</span>
				</h1>
			</FadeIn>

			<FadeIn delay={0.1}>
				<div className="prose dark:prose-invert max-w-none text-lg">
					<p>
						Hey, I&apos;m <strong>Aman</strong> from Islamabad, Pakistan.
					</p>
					<p>
						Welcome to Daily Thoughts — where thoughts get messy, honest, and
						occasionally helpful.
					</p>
					<p>
						Daily Thoughts is my little corner of the internet — a space to
						capture whatever lights up my brain: real-life hacks and
						observations from life here, tech experiments I’m messing with,
						random thoughts that won’t leave me alone, or the occasional
						deep-dive rant.
					</p>
					<p>
						I write when the idea feels alive and worth sharing — no forced
						deadlines, just pure curiosity and whatever flows naturally. That’s
						how this started: I wanted a place that felt 100% like me — direct,
						useful when it can be, and always real.
					</p>
					<p>
						Stick around if you enjoy unfiltered takes and occasional useful
						bits from someone figuring things out one post at a time.
					</p>

					<p>
						Thanks for dropping by — hope you find something that makes you
						think, smile, or bookmark the tab. See you in the posts.
					</p>
				</div>
			</FadeIn>

			<FadeIn delay={0.2}>
				<div className="text-center pt-8">
					<Link href="/">
						<Button size="lg" className="rounded-full px-10">
							Explore the Posts →
						</Button>
					</Link>
				</div>
			</FadeIn>
		</div>
	);
}
