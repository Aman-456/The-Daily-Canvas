import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getBlogsCached } from "@/queries/blog";
import {
	TopicFilterChips,
	TopicFilterChipsFallback,
} from "@/components/client/TopicFilterChips";
import { EditorialArchiveGrid } from "@/components/client/EditorialArchiveGrid";
import { EditorialPagination } from "@/components/client/EditorialPagination";
import {
	blogTagLabel,
	type BlogTagSlug,
	parseListingTitleQuery,
	parseTagSlugsFromSearchParams,
	resolveTopicSlugForPath,
	searchListingHref,
	topicListingHref,
	topicPathFromSlugs,
} from "@/lib/blog-tags";
import { parseSortFromSearchParams } from "@/lib/blog-list-sort";
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

type PageProps = {
	params: Promise<{ segments?: string[] }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
	params,
	searchParams,
}: {
	params: Promise<{ segments?: string[] }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
	const segments = (await params).segments;
	if (!segments?.length) {
		return { title: "Topic Not Found" };
	}

	const resolved: BlogTagSlug[] = [];
	for (const seg of segments) {
		const r = resolveTopicSlugForPath(seg);
		if (!r) return { title: "Topic Not Found" };
		resolved.push(r);
	}
	const uniqueSorted = [...new Set(resolved)].sort();
	const canonicalPath = topicPathFromSlugs(uniqueSorted);
	const multi = uniqueSorted.length > 1;

	const label =
		uniqueSorted.length > 1
			? uniqueSorted.map((s) => blogTagLabel(s)).join(" · ")
			: blogTagLabel(uniqueSorted[0]);
	const title = `${label} — Stories | Daily Thoughts`;
	const description =
		uniqueSorted.length > 1
			? `Read posts tagged with every selected topic on Daily Thoughts.`
			: `Read blog posts and stories tagged “${blogTagLabel(uniqueSorted[0])}” on Daily Thoughts.`;

	return {
		title,
		description,
		keywords: [...uniqueSorted.map((s) => blogTagLabel(s)), "blog", "Daily Thoughts"],
		alternates: {
			canonical: `${baseUrl}${canonicalPath}`,
		},
		openGraph: {
			title,
			description,
			url: `${baseUrl}${canonicalPath}`,
		},
		...(multi && {
			robots: { index: false, follow: true },
		}),
	};
}

export default async function TopicBlogsPage({ params, searchParams }: PageProps) {
	const segments = (await params).segments;
	if (!segments?.length) {
		notFound();
	}

	const sp = await searchParams;
	const page = typeof sp.page === "string" ? Number(sp.page) : 1;
	const titleQuery = parseListingTitleQuery(sp);
	const sort = parseSortFromSearchParams(sp);

	const resolved: BlogTagSlug[] = [];
	for (const seg of segments) {
		const r = resolveTopicSlugForPath(seg);
		if (!r) {
			notFound();
		}
		resolved.push(r);
	}

	const uniqueSorted = [...new Set(resolved)].sort();
	const canonicalPath = topicPathFromSlugs(uniqueSorted);

	const requestPath = `/topics/${segments.join("/")}`;
	if (requestPath !== canonicalPath) {
		redirect(
			topicListingHref({
				slug: uniqueSorted[0],
				extraTags: uniqueSorted.slice(1),
				page,
				sort,
			}),
		);
	}

	const queryTagsRaw = parseTagSlugsFromSearchParams(sp);
	if (queryTagsRaw.length > 0) {
		const merged = [...new Set([...uniqueSorted, ...queryTagsRaw])].sort();
		redirect(
			topicListingHref({
				slug: merged[0],
				extraTags: merged.slice(1),
				page,
				sort,
			}),
		);
	}

	const activeTags = uniqueSorted;

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

	const { blogs, totalPages } = await getBlogsCached(page, 12, "", activeTags, {
		sort,
	});

	const pageHref = (n: number) =>
		topicListingHref({
			slug: activeTags[0],
			extraTags: activeTags.slice(1),
			page: n,
			sort,
		});

	const headingLabel =
		activeTags.length > 1
			? activeTags.map((s) => blogTagLabel(s)).join(" · ")
			: blogTagLabel(activeTags[0]);

	const jsonLdPath = canonicalPath;

	return (
		<div className="space-y-12 sm:space-y-14">
			<header className="flex flex-col gap-6 border-b border-border/50 pb-10 md:flex-row md:items-end md:justify-between">
				<div className="max-w-2xl space-y-4">
					<p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
						Topic
					</p>
					<h1 className="font-headline text-4xl font-extrabold tracking-tighter text-foreground sm:text-5xl md:text-6xl">
						{headingLabel}
					</h1>
					<p className="text-lg leading-relaxed text-muted-foreground">
						{activeTags.length > 1 ? (
							<>
								Posts that include every selected topic:{" "}
								<span className="font-medium text-foreground">
									{activeTags.map((s) => blogTagLabel(s)).join(", ")}
								</span>
								.
							</>
						) : (
							<>
								Stories and posts tagged{" "}
								<span className="font-medium text-foreground">
									{blogTagLabel(activeTags[0])}
								</span>
								.
							</>
						)}
					</p>
					<p className="text-sm">
						<Link
							href="/"
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							← All stories
						</Link>
					</p>
				</div>
			</header>

			<section className="space-y-6">
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
						<TopicFilterChips variant="editorial" listingBase="topic" />
						<ListingSortBar />
					</div>
				</Suspense>
			</section>

			{blogs.length === 0 ? (
				<EditorialListingEmptyState
					title={
						activeTags.length > 1
							? "Nothing matches these topics"
							: "No stories in this topic yet"
					}
					description={
						activeTags.length > 1 ? (
							<>
								No posts include every topic you selected (
								<span className="font-medium text-foreground">
									{activeTags.map((s) => blogTagLabel(s)).join(", ")}
								</span>
								). Try removing a filter or{" "}
								<Link
									href="/archive"
									className="font-medium text-primary underline-offset-4 hover:underline"
								>
									open the archive
								</Link>
								.
							</>
						) : (
							<>
								Posts tagged{" "}
								<span className="font-medium text-foreground">
									{blogTagLabel(activeTags[0])}
								</span>{" "}
								will show up here when they’re published.{" "}
								<Link
									href="/"
									className="font-medium text-primary underline-offset-4 hover:underline"
								>
									Browse all stories
								</Link>
							</>
						)
					}
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
						name: `${headingLabel} — Stories | Daily Thoughts`,
						description:
							activeTags.length > 1
								? `Posts matching topics: ${activeTags.map((s) => blogTagLabel(s)).join(", ")}.`
								: `Read blog posts and stories tagged “${blogTagLabel(activeTags[0])}” on Daily Thoughts.`,
						path: jsonLdPath,
						type: "CollectionPage",
					}),
					breadcrumbListJsonLd([
						{ name: "Home", item: "/" },
						{ name: headingLabel, item: jsonLdPath },
					]),
				])}
			/>
		</div>
	);
}
