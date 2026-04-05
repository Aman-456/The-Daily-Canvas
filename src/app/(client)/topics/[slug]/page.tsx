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
	parseListingTitleQuery,
	resolveTopicSlugForPath,
	searchListingHref,
	topicListingHref,
} from "@/lib/blog-tags";
import { parseSortFromSearchParams } from "@/lib/blog-list-sort";
import { ListingSortBar } from "@/components/client/ListingSortBar";
import { JsonLd } from "@/components/seo/JsonLd";
import {
	breadcrumbListJsonLd,
	jsonLdGraph,
	webPageJsonLd,
} from "@/lib/json-ld";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

export const dynamic = "force-dynamic";

type PageProps = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const raw = (await params).slug;
	const slug = resolveTopicSlugForPath(raw);
	if (!slug) {
		return { title: "Topic Not Found" };
	}

	const label = blogTagLabel(slug);
	const canonicalPath = `/topics/${slug}`;
	const title = `${label} — Stories | Daily Thoughts`;
	const description = `Read blog posts and stories tagged “${label}” on Daily Thoughts.`;

	return {
		title,
		description,
		keywords: [label, "blog", "articles", "Daily Thoughts"],
		alternates: {
			canonical: `${baseUrl}${canonicalPath}`,
		},
		openGraph: {
			title,
			description,
			url: `${baseUrl}${canonicalPath}`,
		},
	};
}

export default async function TopicBlogsPage({ params, searchParams }: PageProps) {
	const raw = (await params).slug;
	const sp = await searchParams;
	const page = typeof sp.page === "string" ? Number(sp.page) : 1;
	const titleQuery = parseListingTitleQuery(sp);

	const slug = resolveTopicSlugForPath(raw);
	if (!slug) {
		notFound();
	}
	const sort = parseSortFromSearchParams(sp);

	if (titleQuery) {
		redirect(
			searchListingHref({
				tags: [slug],
				search: titleQuery,
				page,
				sort,
			}),
		);
	}

	if (slug !== raw) {
		redirect(topicListingHref({ slug, page, sort }));
	}

	const { blogs, totalPages } = await getBlogsCached(page, 12, "", [slug], {
		sort,
	});

	const pageHref = (n: number) => topicListingHref({ slug, page: n, sort });

	const label = blogTagLabel(slug);

	return (
		<div className="space-y-12 sm:space-y-14">
			<header className="flex flex-col gap-6 border-b border-border/50 pb-10 md:flex-row md:items-end md:justify-between">
				<div className="max-w-2xl space-y-4">
					<p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
						Topic
					</p>
					<h1 className="font-headline text-4xl font-extrabold tracking-tighter text-foreground sm:text-5xl md:text-6xl">
						{label}
					</h1>
					<p className="text-lg leading-relaxed text-muted-foreground">
						Stories and posts tagged{" "}
						<span className="font-medium text-foreground">{label}</span>.
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
						<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
							<TopicFilterChipsFallback />
							<div className="h-10 w-44 animate-pulse rounded-xl bg-muted/70" />
						</div>
					}
				>
					<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
						<div className="min-w-0 flex-1">
							<TopicFilterChips variant="editorial" />
						</div>
						<ListingSortBar />
					</div>
				</Suspense>
			</section>

			{blogs.length === 0 ? (
				<div className="py-20 text-center text-muted-foreground">
					No posts with this topic yet.
					<div className="mt-4">
						<Link
							href="/"
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							Browse all stories
						</Link>
					</div>
				</div>
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
						name: `${label} — Stories | Daily Thoughts`,
						description: `Read blog posts and stories tagged “${label}” on Daily Thoughts.`,
						path: `/topics/${slug}`,
						type: "CollectionPage",
					}),
					breadcrumbListJsonLd([
						{ name: "Home", item: "/" },
						{ name: label, item: `/topics/${slug}` },
					]),
				])}
			/>
		</div>
	);
}
