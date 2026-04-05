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
	parseTagSlugsFromSearchParams,
	topicListingHref,
} from "@/lib/blog-tags";
import { homeBlogGridPageSize } from "@/lib/home-blog-grid";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

export const dynamic = "force-dynamic";

export async function generateMetadata({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
	const params = await searchParams;
	const tags = parseTagSlugsFromSearchParams(params);
	const search =
		typeof params.search === "string" ? params.search : "";
	const messy = tags.length > 1 || Boolean(search.trim());

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
	const search = typeof params.search === "string" ? params.search : "";
	const activeTags = parseTagSlugsFromSearchParams(params);

	if (activeTags.length === 1) {
		redirect(topicListingHref({ slug: activeTags[0], search, page }));
	}

	const isCleanArchive = activeTags.length === 0 && !search.trim();
	const gridLimit = isCleanArchive ? homeBlogGridPageSize() : 12;

	const { blogs, totalPages } = await getBlogsCached(
		page,
		gridLimit,
		search,
		activeTags,
	);

	const pageHref = (n: number) =>
		archiveListingHref({
			page: n,
			search,
			tags: activeTags,
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
							Explore the full collection — filter by topic (posts match every
							tag you select) or search by title.
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
				<Suspense fallback={<TopicFilterChipsFallback />}>
					<TopicFilterChips variant="editorial" listingBase="archive" />
				</Suspense>

				{activeTags.length > 0 && (
					<p className="text-sm text-muted-foreground">
						Showing posts that include{" "}
						<span className="font-medium text-foreground">
							{activeTags.map((s) => blogTagLabel(s)).join(", ")}
						</span>
						.{" "}
						<Link
							href={archiveListingHref({ search })}
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
				<EditorialArchiveGrid blogs={blogs} />
			)}

			<EditorialPagination
				page={page}
				totalPages={totalPages}
				pageHref={pageHref}
			/>
		</div>
	);
}
