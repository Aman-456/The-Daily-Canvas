import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getBlogsCached } from "@/queries/blog";
import SearchInput from "@/components/client/SearchInput";
import {
	TopicFilterChips,
	TopicFilterChipsFallback,
} from "@/components/client/TopicFilterChips";
import { BlogPostCardGrid } from "@/components/client/BlogPostCardGrid";
import {
	blogTagLabel,
	isBlogTagSlug,
	topicListingHref,
} from "@/lib/blog-tags";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

export const dynamic = "force-dynamic";

type PageProps = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
	params,
	searchParams,
}: PageProps): Promise<Metadata> {
	const { slug } = await params;
	if (!isBlogTagSlug(slug)) {
		return { title: "Topic Not Found" };
	}

	const sp = await searchParams;
	const search =
		typeof sp.search === "string" ? sp.search : "";
	const hasSearch = Boolean(search.trim());

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
		...(hasSearch && {
			robots: { index: false, follow: true },
		}),
	};
}

export default async function TopicBlogsPage({ params, searchParams }: PageProps) {
	const { slug } = await params;
	if (!isBlogTagSlug(slug)) {
		notFound();
	}

	const sp = await searchParams;
	const page = typeof sp.page === "string" ? Number(sp.page) : 1;
	const search = typeof sp.search === "string" ? sp.search : "";

	const { blogs, totalPages } = await getBlogsCached(page, 12, search, [slug]);

	const pageHref = (n: number) =>
		topicListingHref({ slug, search, page: n });

	const label = blogTagLabel(slug);

	return (
		<div className="space-y-10">
			<div className="flex flex-col md:flex-row items-center justify-between gap-4">
				<div>
					<h1 className="text-4xl font-bold tracking-tight">{label}</h1>
					<p className="text-muted-foreground mt-2">
						Stories and posts tagged{" "}
						<span className="font-medium text-foreground">{label}</span>.
					</p>
					<p className="text-sm mt-2">
						<Link
							href="/"
							className="text-primary underline-offset-4 hover:underline"
						>
							← All stories
						</Link>
					</p>
				</div>

				<SearchInput defaultValue={search} />
			</div>

			<Suspense fallback={<TopicFilterChipsFallback />}>
				<TopicFilterChips />
			</Suspense>

			{blogs.length === 0 ? (
				<div className="text-center py-20 text-muted-foreground">
					No posts with this topic yet.
					<div className="mt-4">
						<Link
							href="/"
							className="text-primary underline-offset-4 hover:underline"
						>
							Browse all stories
						</Link>
					</div>
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
		</div>
	);
}
