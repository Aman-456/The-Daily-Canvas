import Link from "next/link";
import { FadeIn } from "@/components/client/FadeIn";
import { JsonLd } from "@/components/seo/JsonLd";
import {
	breadcrumbListJsonLd,
	jsonLdGraph,
	webPageJsonLd,
} from "@/lib/json-ld";

export const metadata = {
	title: "Community guidelines | Daily Thoughts",
	description:
		"How we expect readers and commenters to show up — respect, relevance, and safety on Daily Thoughts.",
	keywords: ["community", "guidelines", "comments", "daily thoughts"],
	alternates: {
		canonical: "/community-guidelines",
	},
};

export default function CommunityGuidelinesPage() {
	return (
		<div className="container mx-auto max-w-3xl space-y-10 py-5 md:py-10">
			<FadeIn>
				<h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
					Community guidelines
				</h1>
				<p className="mt-3 text-muted-foreground">
					We want discussion to stay thoughtful and safe. These rules apply where
					comments or public participation are available.
				</p>
			</FadeIn>

			<FadeIn delay={0.05}>
				<div className="prose prose-md dark:prose-invert max-w-none text-muted-foreground">
					<h2 className="font-headline text-foreground">Be respectful</h2>
					<p>
						Disagree with ideas, not people. No harassment, slurs, threats, or
						pile-ons. We may remove content or restrict accounts that cross the
						line.
					</p>

					<h2 className="font-headline text-foreground">Stay on topic</h2>
					<p>
						Comments should relate to the post. Spam, unrelated promotion, or
						repeated off-topic posts may be removed.
					</p>

					<h2 className="font-headline text-foreground">Privacy</h2>
					<p>
						Do not share private information about yourself or others. No doxxing
						or outing.
					</p>

					<h2 className="font-headline text-foreground">Moderation</h2>
					<p>
						Moderators may edit, hide, or delete content to enforce these
						guidelines. Serious cases may be reported to platforms or authorities
						where appropriate.
					</p>

					<h2 className="font-headline text-foreground">Contact</h2>
					<p>
						If you see abuse, use reporting tools where available or reach out
						through the channels you provide on your Contact or About page.
					</p>
				</div>
			</FadeIn>

			<p className="text-sm text-muted-foreground">
				<Link href="/faq" className="text-primary hover:underline">
					FAQ
				</Link>
				{" · "}
				<Link href="/terms-of-service" className="text-primary hover:underline">
					Terms
				</Link>
				{" · "}
				<Link href="/" className="text-primary hover:underline">
					Home
				</Link>
			</p>

			<JsonLd
				data={jsonLdGraph([
					webPageJsonLd({
						name: "Community guidelines | Daily Thoughts",
						description:
							"Community guidelines for comments and participation on Daily Thoughts.",
						path: "/community-guidelines",
					}),
					breadcrumbListJsonLd([
						{ name: "Home", item: "/" },
						{
							name: "Community guidelines",
							item: "/community-guidelines",
						},
					]),
				])}
			/>
		</div>
	);
}
