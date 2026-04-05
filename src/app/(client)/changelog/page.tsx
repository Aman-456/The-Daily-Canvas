import Link from "next/link";
import { getPageBySlug } from "@/actions/page";
import {
	CMS_PUBLIC_PAGE_REVALIDATE_SECONDS,
	cmsPageCacheTag,
} from "@/lib/cms-pages";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { JsonLd } from "@/components/seo/JsonLd";
import {
	breadcrumbListJsonLd,
	jsonLdGraph,
	webPageJsonLd,
} from "@/lib/json-ld";

const changelogCacheTag = cmsPageCacheTag("changelog")!;

const getCachedPage = unstable_cache(
	async () => {
		return getPageBySlug("changelog");
	},
	["public-cms-page-changelog"],
	{
		revalidate: CMS_PUBLIC_PAGE_REVALIDATE_SECONDS,
		tags: [changelogCacheTag],
	},
);

export const metadata = {
	title: "Changelog | Daily Thoughts",
	description:
		"Product and content updates for Daily Thoughts — new pages, features, and site notes.",
	keywords: ["changelog", "updates", "daily thoughts"],
	alternates: {
		canonical: "/changelog",
	},
	openGraph: {
		title: "Changelog | Daily Thoughts",
		description:
			"Product and content updates for Daily Thoughts — new pages, features, and site notes.",
		images: [{ url: "/favicon.ico" }],
	},
};

export default async function ChangelogPage() {
	const result = await getCachedPage();

	if (!result.success || !result.data) {
		notFound();
	}

	const page = result.data;

	return (
		<div className="prose prose-md dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl prose-pre:bg-zinc-900 prose-pre:shadow-lg leading-relaxed antialiased">
			<div className="container max-w-3xl mx-auto py-5 md:py-10 space-y-10">
				<h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
					{page.title}
				</h1>
				<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
					{page.content}
				</ReactMarkdown>

				<p className="not-prose text-sm text-muted-foreground">
					<Link href="/" className="font-medium text-primary hover:underline">
						← Home
					</Link>
				</p>
			</div>

			<JsonLd
				data={jsonLdGraph([
					webPageJsonLd({
						name: page.title,
						description:
							"Product and content updates for Daily Thoughts — new pages, features, and site notes.",
						path: "/changelog",
					}),
					breadcrumbListJsonLd([
						{ name: "Home", item: "/" },
						{ name: "Changelog", item: "/changelog" },
					]),
				])}
			/>
		</div>
	);
}
