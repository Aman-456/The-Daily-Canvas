import {
	getBlogBySlugCached,
	getBlogViewCountBySlug,
	getRelatedBlogs,
} from "@/queries/blog";
import { getLatestRootComment } from "@/queries/comment";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SocialShare } from "@/components/client/SocialShare";
import { Metadata } from "next";
import { MarkdownWithToc } from "@/components/blog/MarkdownWithToc";
import { extractTocFromMarkdown } from "@/lib/markdown-toc";
import { TableOfContents } from "@/components/client/TableOfContents";
import { RelatedPosts } from "@/components/client/RelatedPosts";
import { BlogViewTracker } from "@/components/client/BlogViewTracker";
import CommentSection from "@/components/client/CommentSectionLazy";
import {
	blogTagFilterHref,
	blogTagLabel,
	blogTagSlugForLink,
	isBlogTagSlug,
} from "@/lib/blog-tags";
import { JsonLd } from "@/components/seo/JsonLd";
import {
	absoluteUrl,
	breadcrumbListJsonLd,
	jsonLdGraph,
	siteBaseUrl,
} from "@/lib/json-ld";
import { getArticleVoteSummary } from "@/queries/vote";
import {
	ArticleEngagementHydrator,
	OwnerVoteScoreInline,
} from "@/components/client/engagement/ArticleEngagementHydrator";

export const revalidate = 3600;

function buildMetaDescription(blog: {
	title: string;
	metaDescription?: string | null;
	excerpt?: string | null;
	primaryKeyword?: string | null;
}) {
	const rawBase =
		blog.metaDescription?.trim() ||
		blog.excerpt?.trim() ||
		blog.title?.trim() ||
		"";
	const maybeKeyword =
		blog.primaryKeyword && blog.primaryKeyword.trim()
			? blog.primaryKeyword.trim()
			: null;

	const raw =
		!blog.metaDescription &&
		maybeKeyword &&
		!rawBase.toLowerCase().includes(maybeKeyword.toLowerCase())
			? `${maybeKeyword} — ${rawBase}`
			: rawBase;

	const normalized = raw.replace(/\s+/g, " ").trim();
	if (normalized.length <= 160) return normalized;
	return normalized.slice(0, 157).replace(/\s+\S*$/, "").trim() + "...";
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const blog = await getBlogBySlugCached(slug);
	if (!blog) return { title: "Article Not Found" };

	const tags = (blog.tags ?? []).filter(Boolean);
	const primaryKeyword = blog.keywords?.[0]?.trim() || tags[0]?.trim() || null;
	const description = buildMetaDescription({ ...blog, primaryKeyword });
	const canonical = absoluteUrl(`/articles/${blog.slug}`);
	const imageUrl = blog.coverImage ? absoluteUrl(blog.coverImage) : undefined;
	const baseTitle = blog.metaTitle || blog.title;
	const title =
		!blog.metaTitle &&
		primaryKeyword &&
		!baseTitle.toLowerCase().includes(primaryKeyword.toLowerCase()) &&
		baseTitle.length <= 55
			? `${baseTitle} | ${primaryKeyword}`
			: baseTitle;
	const keywords =
		(blog.keywords?.length ? blog.keywords : null) ||
		(tags.length ? tags : null) ||
		["daily thoughts", "article", blog.title];

	return {
		title,
		description,
		keywords,
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				"max-image-preview": "large",
				"max-snippet": -1,
				"max-video-preview": -1,
			},
		},
		alternates: {
			canonical,
		},
		openGraph: {
			type: "article",
			url: canonical,
			title,
			description,
			siteName: "The Daily Canvas",
			publishedTime: new Date(blog.createdAt).toISOString(),
			modifiedTime: new Date(blog.updatedAt || blog.createdAt).toISOString(),
			authors: blog.authorId?.name ? [blog.authorId.name] : undefined,
			tags: tags.length ? tags : undefined,
			images: imageUrl
				? [
						{
							url: imageUrl,
							alt: `${blog.title} cover image`,
						},
					]
				: [],
		},
		twitter: {
			card: imageUrl ? "summary_large_image" : "summary",
			title,
			description,
			images: imageUrl ? [imageUrl] : undefined,
		},
	};
}

function calculateReadTime(content: string) {
	const wordsPerMinute = 200;
	const words = content?.trim()?.split(/\s+/).length;
	const minutes = Math.ceil(words / wordsPerMinute);
	return minutes;
}

export default async function SingleArticlePage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const blog = await getBlogBySlugCached(slug);
	if (!blog) notFound();

	const initialViewCount = await getBlogViewCountBySlug(slug);

	const commentLimit = 10;
	const totalComments = blog.commentsCount || 0;

	const readTime = calculateReadTime(blog.content);

	const latestComment =
		totalComments > 0 ? await getLatestRootComment(blog.id) : null;

	const toc = extractTocFromMarkdown(blog.content);
	const related = await getRelatedBlogs(
		blog.id,
		(blog.tags ?? []).filter(Boolean),
		4,
	);

	const base = siteBaseUrl();
	const postUrl = absoluteUrl(`/articles/${blog.slug}`);
	const cover = blog.coverImage ? absoluteUrl(blog.coverImage) : undefined;

	const { score: articleScore } = await getArticleVoteSummary(blog.id);
	const authorUserId = blog.authorId?.id;

	return (
		<div
			className={
				toc.length > 0
					? "mx-auto max-w-7xl pb-12 px-3 sm:px-6"
					: "mx-auto max-w-5xl pb-12 px-2 md:px-0"
			}
		>
			<div
				className={
					toc.length > 0
						? "lg:flex lg:justify-center lg:gap-5 lg:items-stretch"
						: ""
				}
			>
				<article
					className={
						toc.length > 0
							? "mx-auto min-w-0 w-full max-w-3xl space-y-10 lg:mx-0 lg:max-w-208"
							: "mx-auto min-w-0 max-w-3xl space-y-10"
					}
				>
					<div className="space-y-6">
						<Link
							href="/"
							className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4"
						>
							<span className="mr-2">←</span> Back to stories
						</Link>

						<h1 className="mb-3 text-2xl font-bold leading-snug tracking-tight text-foreground sm:mb-4 sm:text-3xl sm:leading-tight md:text-4xl md:leading-[1.15]">
							{blog.title}
						</h1>

						{blog.excerpt && (
							<p className="m-0 text-sm leading-relaxed text-muted-foreground sm:text-base md:text-[19px] md:leading-relaxed">
								{blog.excerpt}
							</p>
						)}

						{(blog.tags?.length ?? 0) > 0 && (
							<div className="flex flex-wrap gap-2 pt-2">
								{(blog.tags ?? []).map((tag: string) => {
									const label = blogTagLabel(tag);
									const tagSlug = blogTagSlugForLink(tag);
									const className =
										"text-xs font-medium px-2.5 py-1 rounded-full transition-colors " +
										(tagSlug
											? "text-primary/90 bg-primary/10 hover:bg-primary/20"
											: "text-muted-foreground bg-muted/60");
									return tagSlug ? (
										<Link
											key={tag}
											href={blogTagFilterHref(tagSlug)}
											className={
												className +
												" cursor-pointer underline-offset-2 hover:underline"
											}
										>
											{label}
										</Link>
									) : (
										<span key={tag} className={className}>
											{label}
										</span>
									);
								})}
							</div>
						)}

						<div className="mt-6 flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3">
							<div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-initial">
								<Avatar className="h-10 w-10 shrink-0 border shadow-sm">
									<AvatarImage src={blog.authorId?.image || undefined} />
									<AvatarFallback>
										{blog.authorId?.name?.charAt(0) || "D"}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0 text-sm">
									{blog.authorId?.username ? (
										<Link
											href={`/u/${encodeURIComponent(blog.authorId.username)}`}
											className="font-bold text-foreground underline-offset-4 hover:underline"
										>
											{blog.authorId?.name || blog.authorId.username}
										</Link>
									) : (
										<p className="font-bold text-foreground">
											{blog.authorId?.name || "Deleted User"}
										</p>
									)}
									<div className="flex flex-wrap items-center gap-2 text-muted-foreground">
										<span>
											{new Date(blog.createdAt).toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
												year: "numeric",
											})}
										</span>
										<span className="text-[10px]">•</span>
										<span>{readTime} min read</span>
										<span className="text-[10px]">•</span>
										<BlogViewTracker
											slug={blog.slug}
											initialCount={initialViewCount}
										/>
										<OwnerVoteScoreInline
											score={articleScore}
											authorUserId={authorUserId}
										/>
									</div>
								</div>
							</div>
							<ArticleEngagementHydrator
								score={articleScore}
								blogId={blog.id}
								slug={blog.slug}
								authorUserId={authorUserId}
							/>
						</div>
					</div>

					{blog.coverImage && (
						<figure className="space-y-3">
							<div className="relative aspect-video rounded-xl overflow-hidden bg-muted shadow-sm">
								<img
									src={blog.coverImage}
									alt={`${blog.title} cover image`}
									loading="eager"
									decoding="async"
									referrerPolicy="no-referrer"
									className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
								/>
							</div>
						</figure>
					)}

					{toc.length > 0 && (
						<details className="lg:hidden rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
							<summary className="cursor-pointer text-sm font-medium">
								On this page
							</summary>
							<div className="mt-2 pb-1">
								<TableOfContents items={toc} variant="inline" />
							</div>
						</details>
					)}

					<MarkdownWithToc
						content={blog.content}
						className="prose prose-md sm:prose-base md:prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-28 prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl prose-pre:bg-zinc-900 prose-pre:shadow-lg leading-relaxed antialiased blog-content wrap-break-word "
					/>

					<RelatedPosts posts={related} />

					<div className="pt-12 border-t flex flex-col items-center gap-6">
						<div className="text-center space-y-2">
							<p className="font-bold text-lg">Share this story</p>
							<p className="text-sm text-muted-foreground">
								Loved what you read? Help others discover it too.
							</p>
						</div>
						<SocialShare url={`/articles/${blog.slug}`} title={blog.title} />

						<Link href="/" className="mt-8">
							<Button
								variant="outline"
								size="lg"
								className="rounded-full px-8"
							>
								Explore more stories
							</Button>
						</Link>
					</div>

					<CommentSection
						blogId={blog.id}
						slug={blog.slug}
						blogAuthorId={blog.authorId?.id}
						initialHasMore={totalComments > 0}
						total={totalComments}
						limit={commentLimit}
						latestComment={latestComment}
					/>
				</article>
			</div>

			<JsonLd
				data={jsonLdGraph([
					{
						"@type": "BlogPosting",
						"@id": `${postUrl}#article`,
						headline: blog.title,
						description:
							blog.metaDescription || blog.excerpt?.trim() || blog.title,
						...(cover ? { image: [cover] } : {}),
						datePublished: blog.createdAt,
						dateModified: blog.updatedAt || blog.createdAt,
						author: {
							"@type": "Person",
							name: blog.authorId?.name || "Deleted User",
							...(blog.authorId?.image
								? { image: absoluteUrl(blog.authorId.image) }
								: {}),
						},
						publisher: { "@id": `${base}/#organization` },
						mainEntityOfPage: {
							"@type": "WebPage",
							"@id": `${postUrl}#webpage`,
						},
						url: postUrl,
						...(blog.keywords?.length
							? { keywords: blog.keywords.join(", ") }
							: {}),
						...(blog.tags?.filter(isBlogTagSlug).length
							? {
									articleSection: blog.tags
										.filter(isBlogTagSlug)
										.map((t) => blogTagLabel(t))
										.join(", "),
								}
							: {}),
					},
					breadcrumbListJsonLd([
						{ name: "Home", item: "/" },
						{ name: "Archive", item: "/archive" },
						{ name: blog.title, item: `/articles/${blog.slug}` },
					]),
				])}
			/>
		</div>
	);
}

