import Link from "next/link";
import { Suspense } from "react";
import { getHomeSpotlightAndTeaserCached } from "@/queries/blog";
import { HomeFeaturedMosaic } from "@/components/client/HomeFeaturedMosaic";
import {
	TopicFilterChips,
	TopicFilterChipsFallback,
} from "@/components/client/TopicFilterChips";
import { EditorialArchiveGrid } from "@/components/client/EditorialArchiveGrid";
import { EditorialListingEmptyState } from "@/components/client/EditorialListingEmptyState";
import { homeArchiveTeaserCount } from "@/lib/home-blog-grid";
import { JsonLd } from "@/components/seo/JsonLd";
import { jsonLdGraph, webPageJsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

/**
 * Home is a fully static, canonical landing page.
 *
 * Search, topic filters, sort, and pagination all live on dedicated routes
 * (`/search`, `/topics/[slug]`, `/archive`). Keeping `/` free of `searchParams`
 * lets Next render it statically and serve from the CDN; the underlying data
 * queries are still revalidated via the `blogs` cache tag on mutations.
 */
export const dynamic = "force-static";

const HOME_TITLE = "Explore Blogs | Daily Thoughts";
const HOME_DESCRIPTION = "Read the latest stories, blog posts, and insights.";

export const metadata: Metadata = {
	title: HOME_TITLE,
	description: HOME_DESCRIPTION,
	keywords: ["blog", "stories", "insights", "daily thoughts", "reading"],
	alternates: { canonical: `${baseUrl}/` },
	openGraph: {
		title: HOME_TITLE,
		description: HOME_DESCRIPTION,
		url: `${baseUrl}/`,
	},
};

const FEATURED_MOSAIC_COUNT = 4;

export default async function BlogsPage() {
	const teaserLimit = homeArchiveTeaserCount();
	const { spotlight, teaser } = await getHomeSpotlightAndTeaserCached({
		teaserLimit,
		featuredMosaicCount: FEATURED_MOSAIC_COUNT,
	});

	const blogs = teaser.blogs;
	const hasMoreInArchive = teaser.total > blogs.length;
	const featuredSlice = spotlight?.items?.slice(0, FEATURED_MOSAIC_COUNT) ?? [];

	return (
		<div className="space-y-14 sm:space-y-16">
			<header className="max-w-3xl space-y-4">
				<p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
					Digital curation
				</p>
				<h1 className="font-headline text-4xl font-extrabold tracking-tighter text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
					Daily Thoughts
				</h1>
				<p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
					Stories, craft, and ideas at the intersection of design, technology,
					and how we read on the web.
				</p>
			</header>

			{featuredSlice.length > 0 && (
				<HomeFeaturedMosaic items={featuredSlice} />
			)}

			<section
				id="archive"
				className="scroll-mt-28 space-y-8 border-b border-border/50 pb-10"
			>
				<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
					<div>
						<h2 className="font-headline text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
							The archive
						</h2>
						<p className="mt-2 max-w-lg text-muted-foreground">
							Browse the full collection. Filter by topic — posts match every tag
							you select.{" "}
							<Link
								href="/archive"
								className="font-medium text-primary underline-offset-4 hover:underline"
							>
								Open archive page
							</Link>
						</p>
					</div>
				</div>

				<Suspense fallback={<TopicFilterChipsFallback />}>
					<TopicFilterChips variant="editorial" />
				</Suspense>
			</section>

			{blogs.length === 0 ? (
				<EditorialListingEmptyState
					title="Nothing to show yet"
					description="No posts are available on the home teaser yet. Open the archive for the full list."
				/>
			) : (
				<EditorialArchiveGrid blogs={blogs} />
			)}

			{blogs.length > 0 && (
				<div className="flex flex-col items-center gap-2 pt-8">
					<Link
						href="/archive"
						className="font-headline inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-10 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
					>
						Show more
					</Link>
					<p className="text-center text-xs text-muted-foreground">
						{hasMoreInArchive
							? "More posts live on the archive page."
							: "Open the archive for pagination and the full list."}
					</p>
				</div>
			)}

			<JsonLd
				data={jsonLdGraph([
					webPageJsonLd({
						name: "Daily Thoughts — Stories and ideas",
						description:
							"Stories, craft, and ideas at the intersection of design, technology, and how we read on the web.",
						path: "/",
					}),
				])}
			/>
		</div>
	);
}
