import { getPageBySlug } from "@/actions/page";
import {
	CMS_PUBLIC_PAGE_REVALIDATE_SECONDS,
	cmsPageCacheTag,
} from "@/lib/cms-pages";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { JsonLd } from "@/components/seo/JsonLd";
import { FadeIn } from "@/components/client/FadeIn";
import { FaqMarkdownBody } from "@/components/client/FaqMarkdownBody";
import {
	breadcrumbListJsonLd,
	jsonLdGraph,
	webPageJsonLd,
} from "@/lib/json-ld";

const faqCacheTag = cmsPageCacheTag("faq")!;

const getCachedPage = unstable_cache(
	async () => {
		return getPageBySlug("faq");
	},
	["public-cms-page-faq"],
	{
		revalidate: CMS_PUBLIC_PAGE_REVALIDATE_SECONDS,
		tags: [faqCacheTag],
	},
);

export const metadata = {
	title: "FAQ | Daily Thoughts",
	description:
		"Frequently asked questions about Daily Thoughts — reading, search, topics, and newsletter.",
	keywords: ["faq", "help", "daily thoughts"],
	alternates: {
		canonical: "/faq",
	},
	openGraph: {
		title: "FAQ | Daily Thoughts",
		description:
			"Frequently asked questions about Daily Thoughts — reading, search, topics, and newsletter.",
		images: [{ url: "/favicon.ico" }],
	},
};

export default async function FaqPage() {
	const result = await getCachedPage();

	if (!result.success || !result.data) {
		notFound();
	}

	const page = result.data;

	return (
		<div className="antialiased">
			<div className="container mx-auto max-w-3xl space-y-10 py-5 md:py-10">
				<FadeIn>
					<h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-center md:text-4xl">
						{page.title}
					</h1>
				</FadeIn>
				<FadeIn>
					<FaqMarkdownBody content={page.content} />
				</FadeIn>
				<FadeIn>
					<p className="text-sm text-muted-foreground">
						<Link href="/community-guidelines" className="text-primary hover:underline">
							Community guidelines
						</Link>
						{" · "}
						<Link href="/" className="text-primary hover:underline">
							Home
						</Link>
					</p>
				</FadeIn>
			</div>

			<JsonLd
				data={jsonLdGraph([
					webPageJsonLd({
						name: page.title,
						description:
							"Frequently asked questions about Daily Thoughts — reading, search, topics, and newsletter.",
						path: "/faq",
					}),
					breadcrumbListJsonLd([
						{ name: "Home", item: "/" },
						{ name: "FAQ", item: "/faq" },
					]),
				])}
			/>
		</div>
	);
}
