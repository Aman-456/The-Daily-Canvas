import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getBlogsCached, getSpotlightStrip } from "@/queries/blog";
import { HomeFeaturedMosaic } from "@/components/client/HomeFeaturedMosaic";
import {
	TopicFilterChips,
	TopicFilterChipsFallback,
} from "@/components/client/TopicFilterChips";
import { EditorialArchiveGrid } from "@/components/client/EditorialArchiveGrid";
import {
	archiveListingHref,
	blogListingHref,
	blogTagLabel,
	parseListingTitleQuery,
	parseTagSlugsFromSearchParams,
	searchListingHref,
	topicListingHref,
} from "@/lib/blog-tags";
import { parseSortFromSearchParams } from "@/lib/blog-list-sort";
import { ListingSortBar } from "@/components/client/ListingSortBar";
import { EditorialListingEmptyState } from "@/components/client/EditorialListingEmptyState";
import { homeArchiveTeaserCount } from "@/lib/home-blog-grid";
import { JsonLd } from "@/components/seo/JsonLd";
import {
	jsonLdGraph,
	webPageJsonLd,
} from "@/lib/json-ld";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

export async function generateMetadata({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
	const params = await searchParams;
	const tags = parseTagSlugsFromSearchParams(params);
	const messy = tags.length > 1;

	const title = "Explore Blogs | Daily Thoughts";
	const description =
		"Read the latest stories, blog posts, and insights.";

	return {
		title,
		description,
		keywords: ["blog", "stories", "insights", "daily thoughts", "reading"],
		alternates: {
			canonical: `${baseUrl}/`,
		},
		openGraph: {
			title,
			description,
			url: `${baseUrl}/`,
		},
		...(messy && {
			robots: { index: false, follow: true },
		}),
	};
}

export default async function BlogsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const page = typeof params.page === "string" ? Number(params.page) : 1;
	const titleQuery = parseListingTitleQuery(params);
	const activeTags = parseTagSlugsFromSearchParams(params);
	const sort = parseSortFromSearchParams(params);

	if (titleQuery) {
		redirect(
			searchListingHref({
				tags: activeTags,
				search: titleQuery,
				page,
				sort,
			}),
		);
	}

	if (activeTags.length === 1) {
		redirect(topicListingHref({ slug: activeTags[0], page, sort }));
	}

	if (activeTags.length > 1) {
		redirect(
			archiveListingHref({
				tags: activeTags,
				page,
				sort,
			}),
		);
	}

	if (page > 1) {
		redirect(
			archiveListingHref({
				page,
				tags: activeTags,
				sort,
			}),
		);
	}

	const isCleanHome = activeTags.length === 0;
	const spotlightStrip = isCleanHome ? await getSpotlightStrip() : null;
	const teaserLimit = homeArchiveTeaserCount();
	/** Only exclude posts shown in the featured mosaic (4), not the full spotlight strip (8). */
	const featuredMosaicCount = 4;
	const excludeSpotlightSlugs =
		spotlightStrip?.items?.length && isCleanHome
			? spotlightStrip.items.slice(0, featuredMosaicCount).map((b) => b.slug)
			: undefined;

	const { blogs, total } = await getBlogsCached(
		1,
		teaserLimit,
		"",
		activeTags,
		{
			...(excludeSpotlightSlugs
				? { excludeSlugs: excludeSpotlightSlugs }
				: {}),
			sort,
		},
	);

	const archiveMoreHref = archiveListingHref({ tags: activeTags, sort });
	const hasMoreInArchive = total > blogs.length;

	const featuredSlice =
		spotlightStrip?.items?.length && page === 1
			? spotlightStrip.items.slice(0, featuredMosaicCount)
			: [];

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

				{isCleanHome ? (
					<Suspense fallback={<TopicFilterChipsFallback />}>
						<TopicFilterChips variant="editorial" />
					</Suspense>
				) : (
					<Suspense
						fallback={
							<div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(200px,240px)] md:items-end md:gap-6">
								<TopicFilterChipsFallback />
								<div className="flex w-full min-w-0 flex-col gap-2 md:max-w-[240px]">
									<div className="h-3 w-14 animate-pulse rounded bg-muted/70" />
									<div className="h-11 w-full animate-pulse rounded-xl bg-muted/70" />
								</div>
							</div>
						}
					>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(200px,240px)] md:items-end md:gap-6">
							<TopicFilterChips variant="editorial" />
							<ListingSortBar />
						</div>
					</Suspense>
				)}

				{activeTags.length > 0 && (
					<p className="text-sm text-muted-foreground">
						Showing posts that include{" "}
						<span className="font-medium text-foreground">
							{activeTags.map((s) => blogTagLabel(s)).join(", ")}
						</span>
						.{" "}
						<Link
							href={blogListingHref({ sort })}
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							Clear topics
						</Link>
					</p>
				)}
			</section>

			{blogs.length === 0 ? (
				<EditorialListingEmptyState
					title="Nothing to show yet"
					description="No posts match these filters on the home teaser. Try another topic or open the archive for the full list."
				/>
			) : (
				<EditorialArchiveGrid blogs={blogs} />
			)}

			{blogs.length > 0 && (
				<div className="flex flex-col items-center gap-2 pt-8">
					<Link
						href={archiveMoreHref}
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
