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
		robots: { index: false, follow: true },
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

	if (!titleQuery) {
		return (
			<div className="space-y-12 pb-16 sm:space-y-14 sm:pb-24">
				<section className="flex flex-col items-center py-10 text-center sm:py-14 md:py-20">
					<div className="mb-10 w-full max-w-2xl sm:mb-12">
						<SearchInput variant="hero" defaultValue="" key="search-landing" />
					</div>
					<h1 className="mb-3 font-headline text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
						Search the archive
					</h1>
					<p className="max-w-md text-sm leading-relaxed text-muted-foreground">
						Enter a title keyword above, then narrow with topics or sort.{" "}
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
								<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
									<TopicFilterChipsFallback />
									<div className="h-10 w-44 shrink-0 animate-pulse rounded-xl bg-muted/70" />
								</div>
							</div>
						}
					>
						<div className="rounded-xl border border-border/40 bg-muted/30 p-4 dark:bg-muted/15">
							<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
								<div className="min-w-0 flex-1">
									<TopicFilterChips variant="editorial" listingBase="search" />
								</div>
								<div className="shrink-0 md:pl-4">
									<ListingSortBar />
								</div>
							</div>
						</div>
					</Suspense>

					{activeTags.length > 0 && (
						<p className="text-center text-sm text-muted-foreground sm:text-left">
							When you search, results will be limited to posts that include{" "}
							<span className="font-medium text-foreground">
								{activeTags.map((s) => blogTagLabel(s)).join(", ")}
							</span>
							.{" "}
							<Link
								href={searchListingHref({ sort })}
								className="font-medium text-primary underline-offset-4 hover:underline"
							>
								Clear topics
							</Link>
						</p>
					)}
				</section>
			</div>
		);
	}

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

	const countLine =
		total === 0
			? "No articles match this search"
			: total === 1
				? "1 article found in the archive"
				: `${total} articles found in the archive`;

	const clearSearchHref = searchListingHref({ tags: activeTags, sort });

	return (
		<div className="space-y-12 pb-16 sm:space-y-14 sm:pb-24">
			<section className="flex flex-col items-center py-10 text-center sm:py-14 md:py-20">
				<div className="mb-10 w-full max-w-2xl sm:mb-12">
					<SearchInput
						variant="hero"
						defaultValue={titleQuery}
						key={titleQuery}
					/>
				</div>
				<h1 className="mb-3 font-headline text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
					Search results for “{titleQuery}”
				</h1>
				<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
					{countLine}
				</p>
				<p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
					Title matches across the site. Narrow with topics (every selected tag must
					match) or change sort.{" "}
					<Link
						href={clearSearchHref}
						className="font-medium text-foreground underline-offset-4 hover:underline"
					>
						Clear search
					</Link>
					{" · "}
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
							<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
								<TopicFilterChipsFallback />
								<div className="h-10 w-44 shrink-0 animate-pulse rounded-xl bg-muted/70" />
							</div>
						</div>
					}
				>
					<div className="rounded-xl border border-border/40 bg-muted/30 p-4 dark:bg-muted/15">
						<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
							<div className="min-w-0 flex-1">
								<TopicFilterChips variant="editorial" listingBase="search" />
							</div>
							<div className="shrink-0 md:pl-4">
								<ListingSortBar />
							</div>
						</div>
					</div>
				</Suspense>

				{activeTags.length > 0 && (
					<p className="text-center text-sm text-muted-foreground sm:text-left">
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

			{blogs.length === 0 ? (
				<div className="py-20 text-center text-muted-foreground">
					No blogs found matching your criteria.
				</div>
			) : (
				<EditorialArchiveGrid
					blogs={blogs}
					className="gap-10 sm:gap-12 md:gap-12 lg:gap-12"
				/>
			)}

			<EditorialPagination
				page={page}
				totalPages={totalPages}
				pageHref={pageHref}
			/>
		</div>
	);
}
