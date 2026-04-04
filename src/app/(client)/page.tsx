import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getBlogsCached } from "@/queries/blog";
import SearchInput from "@/components/client/SearchInput";
import {
	TopicFilterChips,
	TopicFilterChipsFallback,
} from "@/components/client/TopicFilterChips";
import { BlogPostCardGrid } from "@/components/client/BlogPostCardGrid";
import {
	blogListingHref,
	blogTagLabel,
	parseTagSlugsFromSearchParams,
	topicListingHref,
} from "@/lib/blog-tags";
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
	const search = typeof params.search === "string" ? params.search : "";
	const activeTags = parseTagSlugsFromSearchParams(params);

	if (activeTags.length === 1) {
		redirect(topicListingHref({ slug: activeTags[0], search, page }));
	}

	const { blogs, totalPages } = await getBlogsCached(page, 12, search, activeTags);

	const pageHref = (n: number) =>
		blogListingHref({
			page: n,
			search,
			tags: activeTags,
		});

	return (
		<div className="space-y-10">
			<div className="flex flex-col md:flex-row items-center justify-between gap-4">
				<div>
					<h1 className="text-4xl font-bold tracking-tight">Explore Blogs</h1>
					<p className="text-muted-foreground mt-2">
						Read the latest stories and insights.
					</p>
				</div>

				<SearchInput defaultValue={search} />
			</div>

			<Suspense fallback={<TopicFilterChipsFallback />}>
				<TopicFilterChips />
			</Suspense>

			{activeTags.length > 0 && (
				<p className="text-sm text-muted-foreground">
					Showing posts that include{" "}
					<span className="font-medium text-foreground">
						{activeTags.map((s) => blogTagLabel(s)).join(", ")}
					</span>{" "}
					(all selected topics).{" "}
					<Link
						href={blogListingHref({ search })}
						className="text-primary underline-offset-4 hover:underline"
					>
						Clear topics
					</Link>
				</p>
			)}

			{blogs.length === 0 ? (
				<div className="text-center py-20 text-muted-foreground">
					No blogs found matching your criteria.
				</div>
			) : (
				<BlogPostCardGrid blogs={blogs} />
			)}

			{totalPages > 1 && (
				<div className="flex justify-center gap-2 pt-10">
					{Array.from({ length: totalPages }).map((_, i) => (
						<Link
							key={i}
							href={pageHref(i + 1)}
							className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${page === i + 1
								? "bg-primary text-primary-foreground font-bold"
								: "bg-muted hover:bg-muted/80"
								}`}
						>
							{i + 1}
						</Link>
					))}
				</div>
			)}

			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "WebSite",
						name: "The Daily Thoughts",
						url: process.env.NEXT_PUBLIC_APP_URL,
						potentialAction: {
							"@type": "SearchAction",
							target: `${process.env.NEXT_PUBLIC_APP_URL
								}/?search={search_term_string}`,
							"query-input": "required name=search_term_string",
						},
					}),
				}}
			/>
		</div>
	);
}
