import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getBlogsCached } from "@/queries/blog";
import {
	TopicFilterChips,
	TopicFilterChipsFallback,
} from "@/components/client/TopicFilterChips";
import { EditorialArchiveGrid } from "@/components/client/EditorialArchiveGrid";
import { EditorialPagination } from "@/components/client/EditorialPagination";
import {
	archiveListingHref,
	blogTagLabel,
	parseListingTitleQuery,
	parseTagSlugsFromSearchParams,
	searchListingHref,
	topicListingHref,
} from "@/lib/blog-tags";
import { parseSortFromSearchParams } from "@/lib/blog-list-sort";
import { homeBlogGridPageSize } from "@/lib/home-blog-grid";
import { ListingSortBar } from "@/components/client/ListingSortBar";
import { EditorialListingEmptyState } from "@/components/client/EditorialListingEmptyState";
import { JsonLd } from "@/components/seo/JsonLd";
import {
	breadcrumbListJsonLd,
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

	const title = "Archive | Daily Thoughts";
	const description =
		"Browse every story — filter by topic or search the full collection.";

	return {
		title,
		description,
		keywords: ["archive", "blog", "stories", "topics", "Daily Thoughts"],
		alternates: {
			canonical: `${baseUrl}/archive`,
		},
		openGraph: {
			title,
			description,
			url: `${baseUrl}/archive`,
		},
		...(messy && {
			robots: { index: false, follow: true },
		}),
	};
}

export default async function ArchivePage({
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

	if (activeTags.length > 1) {
		redirect(
			topicListingHref({
				slug: activeTags[0],
				extraTags: activeTags.slice(1),
				page,
				sort,
			}),
		);
	}

	if (activeTags.length === 1) {
		redirect(topicListingHref({ slug: activeTags[0], page, sort }));
	}

	const isCleanArchive = activeTags.length === 0;
	const gridLimit = isCleanArchive ? homeBlogGridPageSize() : 12;

	const { blogs, totalPages } = await getBlogsCached(
		page,
		gridLimit,
		"",
		activeTags,
		{ sort },
	);

	const pageHref = (n: number) =>
		archiveListingHref({
			page: n,
			tags: activeTags,
			sort,
		});

	return (
		<div className="space-y-12 sm:space-y-14">
			<header className="border-b border-border/50 pb-10">
				<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
					<div className="max-w-2xl space-y-4">
						<p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
							Digital curation
						</p>
						<h1 className="font-headline text-4xl font-extrabold tracking-tighter text-foreground sm:text-5xl md:text-6xl">
							Journal archive
						</h1>
						<p className="text-lg leading-relaxed text-muted-foreground">
							Explore the full collection — filter by topic (posts match every tag
							you select) or use search in the header.
						</p>
						<p className="text-sm">
							<Link
								href="/"
								className="font-medium text-primary underline-offset-4 hover:underline"
							>
								← Home
							</Link>
						</p>
					</div>
				</div>
			</header>

			<section className="space-y-8">
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
						<TopicFilterChips variant="editorial" listingBase="archive" />
						<ListingSortBar />
					</div>
				</Suspense>

				{activeTags.length > 0 && (
					<p className="text-sm text-muted-foreground">
						Showing posts that include{" "}
						<span className="font-medium text-foreground">
							{activeTags.map((s) => blogTagLabel(s)).join(", ")}
						</span>
						.{" "}
						<Link
							href={archiveListingHref({ sort })}
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							Clear topics
						</Link>
					</p>
				)}
			</section>

			{blogs.length === 0 ? (
				<EditorialListingEmptyState
					title="Nothing matches"
					description="No posts match the topics you’ve selected. Try clearing a tag or opening the full archive without filters."
				/>
			) : (
				<EditorialArchiveGrid blogs={blogs} />
			)}

			<EditorialPagination
				page={page}
				totalPages={totalPages}
				pageHref={pageHref}
			/>

			<JsonLd
				data={jsonLdGraph([
					webPageJsonLd({
						name: "Journal archive | Daily Thoughts",
						description:
							"Browse every story — filter by topic or search the full collection.",
						path: "/archive",
						type: "CollectionPage",
					}),
					breadcrumbListJsonLd([
						{ name: "Home", item: "/" },
						{ name: "Archive", item: "/archive" },
					]),
				])}
			/>
		</div>
	);
}
