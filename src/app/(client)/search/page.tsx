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
	blogTagLabel,
	parseListingQueryParamOnly,
	parseListingTitleQuery,
	parseTagSlugsFromSearchParams,
	searchListingHref,
} from "@/lib/blog-tags";
import { parseSortFromSearchParams } from "@/lib/blog-list-sort";
import { ListingSortBar } from "@/components/client/ListingSortBar";
import SearchInput from "@/components/client/SearchInput";
import { SearchScrollToResults } from "@/components/client/SearchScrollToResults";
import { SearchNoResultsIllustration } from "@/components/client/EditorialListingEmptyState";
import { JsonLd } from "@/components/seo/JsonLd";
import {
	breadcrumbListJsonLd,
	jsonLdGraph,
	searchActionJsonLd,
	webPageJsonLd,
} from "@/lib/json-ld";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

export const dynamic = "force-dynamic";

export async function generateMetadata({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
	const params = await searchParams;
	const q = parseListingTitleQuery(params);
	const title = q ? `Search: ${q} | Daily Thoughts` : "Search | Daily Thoughts";
	const description = q
		? `Title search results for “${q}” on Daily Thoughts.`
		: "Search stories by title and narrow with topics.";

	const hasTitleQuery = Boolean(parseListingQueryParamOnly(params).trim());

	return {
		title,
		description,
		keywords: ["search", "blog", "stories", "Daily Thoughts"],
		alternates: {
			canonical: `${baseUrl}/search`,
		},
		openGraph: {
			title,
			description,
			url: `${baseUrl}/search`,
		},
		robots: hasTitleQuery
			? { index: false, follow: true }
			: { index: true, follow: true },
	};
}

export default async function SearchPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const page = typeof params.page === "string" ? Number(params.page) : 1;
	const activeTags = parseTagSlugsFromSearchParams(params);
	const sort = parseSortFromSearchParams(params);

	const queryOnly = parseListingQueryParamOnly(params);
	const combinedTitle = parseListingTitleQuery(params);
	if (combinedTitle && !queryOnly) {
		redirect(
			searchListingHref({
				tags: activeTags,
				search: combinedTitle,
				page,
				sort,
			}),
		);
	}

	const titleQuery = queryOnly;
	const hasQuery = Boolean(titleQuery.trim());

	const { blogs, total, totalPages } = await getBlogsCached(
		page,
		12,
		titleQuery,
		activeTags,
		{
			sort,
		},
	);

	const pageHref = (n: number) =>
		searchListingHref({
			page: n,
			search: titleQuery,
			tags: activeTags,
			sort,
		});

	const countLine = hasQuery
		? total === 0
			? "No articles match this search"
			: total === 1
				? "1 article found in the archive"
				: `${total} articles found in the archive`
		: total === 0
			? "No articles in the archive yet"
			: total === 1
				? "1 article in the archive"
				: `${total} articles in the archive`;

	const clearSearchHref = searchListingHref({ tags: activeTags, sort });
	const queryPath = hasQuery
		? `/search?query=${encodeURIComponent(titleQuery)}`
		: "/search";

	return (
		<div className="space-y-12 pb-16 sm:space-y-14 sm:pb-24">
			<SearchScrollToResults hasQuery={hasQuery} queryKey={titleQuery} />
			<section className="flex flex-col items-center py-10 text-center sm:py-14 md:py-20">
				<div className="mb-10 w-full max-w-2xl sm:mb-12">
					<SearchInput
						variant="hero"
						defaultValue={titleQuery}
						key={hasQuery ? titleQuery : "search-hub"}
					/>
				</div>
				<h1 className="mb-3 font-headline text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
					{hasQuery ? (
						<>Search results for “{titleQuery}”</>
					) : (
						<>Search the archive</>
					)}
				</h1>
				<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
					{countLine}
				</p>
				<p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
					{hasQuery ? (
						<>
							Title matches across the site. Narrow with topics (every selected tag
							must match) or change sort.{" "}
							<Link
								href={clearSearchHref}
								className="font-medium text-foreground underline-offset-4 hover:underline"
							>
								Clear search
							</Link>
							{" · "}
						</>
					) : (
						<>
							Browse everything below, or type a keyword to filter by title. Use
							topics and sort to narrow the list.{" "}
						</>
					)}
					<Link
						href="/"
						className="font-medium text-primary underline-offset-4 hover:underline"
					>
						Home
					</Link>
				</p>
			</section>

			<section className="space-y-6">
				<Suspense
					fallback={
						<div className="rounded-xl border border-border/40 bg-muted/30 p-4 dark:bg-muted/15">
							<div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(200px,240px)] md:items-end md:gap-6">
								<TopicFilterChipsFallback />
								<div className="flex w-full min-w-0 flex-col gap-2 md:max-w-[240px]">
									<div className="h-3 w-14 animate-pulse rounded bg-muted/70" />
									<div className="h-11 w-full animate-pulse rounded-xl bg-muted/70" />
								</div>
							</div>
						</div>
					}
				>
					<div className="rounded-xl border border-border/40 bg-muted/30 p-4 dark:bg-muted/15">
						<div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(200px,240px)] md:items-end md:gap-6">
							<TopicFilterChips variant="editorial" listingBase="search" />
							<ListingSortBar />
						</div>
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
							href={searchListingHref({ search: titleQuery, sort })}
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							Clear topics
						</Link>
					</p>
				)}
			</section>

			<div
				id="search-blog-results"
				className="scroll-mt-[6.5rem] outline-none"
				tabIndex={-1}
			>
				{blogs.length === 0 ? (
					<SearchNoResultsIllustration
						hasQuery={hasQuery}
						query={titleQuery}
					/>
				) : (
					<EditorialArchiveGrid
						blogs={blogs}
						className="gap-10 sm:gap-12 md:gap-12 lg:gap-12"
					/>
				)}
			</div>

			<EditorialPagination
				page={page}
				totalPages={totalPages}
				pageHref={pageHref}
			/>

			<JsonLd
				data={
					hasQuery
						? jsonLdGraph([
								webPageJsonLd({
									name: `Search: ${titleQuery} | Daily Thoughts`,
									description: `Title search results for “${titleQuery}” on Daily Thoughts.`,
									path: queryPath,
									type: "SearchResultsPage",
								}),
								breadcrumbListJsonLd([
									{ name: "Home", item: "/" },
									{ name: "Search", item: "/search" },
									{
										name: `“${titleQuery}”`,
										item: queryPath,
									},
								]),
							])
						: jsonLdGraph([
								webPageJsonLd({
									name: "Search the archive | Daily Thoughts",
									description:
										"Search stories by title and narrow results with topics or sort.",
									path: "/search",
									potentialAction: searchActionJsonLd(),
								}),
								breadcrumbListJsonLd([
									{ name: "Home", item: "/" },
									{ name: "Search", item: "/search" },
								]),
							])
				}
			/>
		</div>
	);
}
