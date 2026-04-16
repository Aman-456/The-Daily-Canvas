import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
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
import { SearchScrollToResults } from "@/components/client/SearchScrollToResults";
import { SearchNoResultsIllustration } from "@/components/client/EditorialListingEmptyState";
import { getPublicAuthorsForFilter } from "@/queries/author";
import { getBlogsForSearch2 } from "@/queries/blog";
import { SearchSidebarFilters } from "@/components/client/search/SearchSidebarFilters";
import { SearchFiltersShell } from "@/components/client/search/SearchFiltersShell";
import { JsonLd } from "@/components/seo/JsonLd";
import {
	breadcrumbListJsonLd,
	jsonLdGraph,
	searchActionJsonLd,
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
	const excludeRaw = params.excludeTag;
	const excludeTags =
		typeof excludeRaw === "string"
			? [excludeRaw]
			: Array.isArray(excludeRaw)
				? excludeRaw
				: [];
	const authorUsername = typeof params.author === "string" ? params.author : undefined;
	const minScore =
		typeof params.minScore === "string" && params.minScore.trim()
			? Number(params.minScore)
			: undefined;

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

	const [authors, { blogs, total, totalPages }] = await Promise.all([
		getPublicAuthorsForFilter(250),
		getBlogsForSearch2({
			page,
			limit: 12,
			search: titleQuery,
			includeTags: activeTags,
			excludeTags,
			authorUsername,
			minScore,
			sort,
		}),
	]);

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
		<div className="space-y-10 pb-16 sm:space-y-12 sm:pb-24">
			<SearchScrollToResults hasQuery={hasQuery} queryKey={titleQuery} />
			<header className="space-y-6">
				<div className="max-w-3xl space-y-2">
					<h1 className="font-headline text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
						{hasQuery ? <>Search results for “{titleQuery}”</> : <>Search the archive</>}
					</h1>
					<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
						{countLine}
					</p>
					{hasQuery ? null : (
						<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Browse everything below, or type a keyword to filter by title.
						</p>
					)}
				</div>
			</header>

			<section className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
				<aside className="lg:sticky lg:top-24 lg:self-start">
					<div className="rounded-2xl border border-border/40 bg-muted/20 p-4 dark:bg-muted/10">
						<SearchFiltersShell>
							<div className="mt-3">
								<SearchSidebarFilters authors={authors} />
							</div>
							<div className="mt-3">
								<Suspense fallback={<TopicFilterChipsFallback />}>
									<TopicFilterChips listingBase="search" />
								</Suspense>
							</div>
						</SearchFiltersShell>
					</div>
				</aside>

				<div className="min-w-0 space-y-6">
					<div className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-muted/20 p-4 dark:bg-muted/10 sm:flex-row sm:items-end sm:justify-between">
						<div className="min-w-0">
							<p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
								Sort
							</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Refine by topic on the left, then order results here.
							</p>
						</div>
						<div className="shrink-0">
							<ListingSortBar />
						</div>
					</div>

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

					<div id="search-blog-results" className="scroll-mt-26 outline-none" tabIndex={-1}>
						{blogs.length === 0 ? (
							<SearchNoResultsIllustration hasQuery={hasQuery} query={titleQuery} />
						) : (
							<EditorialArchiveGrid blogs={blogs} className="gap-10 sm:gap-12 md:gap-12 lg:gap-12" />
						)}
					</div>

					<EditorialPagination page={page} totalPages={totalPages} pageHref={pageHref} />
				</div>
			</section>

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
