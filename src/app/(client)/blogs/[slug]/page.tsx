import { getBlogBySlugCached } from "@/queries/blog";
import { getLatestRootComment } from "@/queries/comment";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SocialShare } from "@/components/client/SocialShare";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { CommentSection } from "@/components/client/CommentSection";
import { auth } from "@/auth";
import Image from "next/image";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const blog = await getBlogBySlugCached(slug);
	if (!blog) return { title: "Blog Not Found" };

	return {
		title: blog.metaTitle || blog.title,
		description: blog.metaDescription || blog.excerpt.substring(0, 150),
		keywords: blog.keywords || blog.tags || ["blog", "daily thoughts", "article", blog.title],
		alternates: {
			canonical: `/blogs/${blog.slug}`,
		},
		openGraph: {
			title: blog.metaTitle || blog.title,
			description: blog.metaDescription || blog.excerpt.substring(0, 150),
			images: blog.coverImage ? [blog.coverImage] : [],
		},
	};
}

function calculateReadTime(content: string) {
	const wordsPerMinute = 200;
	const words = content.trim().split(/\s+/).length;
	const minutes = Math.ceil(words / wordsPerMinute);
	return minutes;
}

export default async function SingleBlogPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const blog = await getBlogBySlugCached(slug);

	if (!blog) {
		notFound();
	}

	const session = await auth();

	// Use aggregated count for deferred loading
	const commentLimit = 10;
	const totalComments = blog.commentsCount || 0;

	const readTime = calculateReadTime(blog.content);

	// Fetch latest comment for preview
	const latestComment =
		totalComments > 0 ? await getLatestRootComment(blog._id) : null;

	return (
		<article className="max-w-3xl mx-auto pb-12 px-2 md:px-0 space-y-10">
			<div className="space-y-6">
				<Link
					href="/"
					className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4"
				>
					<span className="mr-2">←</span> Back to stories
				</Link>

				<h1 className="text-3xl sm:text-4xl font-bold tracking-normal leading-[40px]k sm:leading-[44px] text-foreground mb-[12px]">
					{blog.title}
				</h1>

				{blog.excerpt && (
					<p className="text-[17px] md:text-[19px] text-muted-foreground font-normal m-0">
						{blog.excerpt}
					</p>
				)}

				<div className="flex items-center justify-between mt-6">
					<div className="flex items-center gap-3">
						<Avatar className="h-10 w-10 border shadow-sm">
							<AvatarImage src={blog.authorId?.image} />
							<AvatarFallback>
								{blog.authorId?.name?.charAt(0) || "D"}
							</AvatarFallback>
						</Avatar>
						<div className="text-sm">
							<p className="font-bold text-foreground">{blog.authorId?.name || "Deleted User"}</p>
							<div className="flex items-center gap-2 text-muted-foreground">
								<span>
									{new Date(blog.createdAt).toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
										year: "numeric",
									})}
								</span>
								<span className="text-[10px]">•</span>
								<span>{readTime} min read</span>
							</div>
						</div>
					</div>

					<div className="hidden sm:block">
						<SocialShare
							url={`/blogs/${blog.slug}`}
							title={blog.title}
							size="sm"
						/>
					</div>
				</div>
			</div>

			{blog.coverImage && (
				<figure className="space-y-3">
					<div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-muted shadow-sm">
						<Image
							src={blog.coverImage}
							alt={blog.title}
							fill
							priority
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
							className="object-cover transition-transform duration-500 hover:scale-105"
						/>
					</div>
				</figure>
			)}

			{/* Content Rendering */}
			<div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl prose-pre:bg-zinc-900 prose-pre:shadow-lg leading-relaxed antialiased blog-content">
				<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
					{blog.content}
				</ReactMarkdown>
			</div>

			<div className="pt-12 border-t flex flex-col items-center gap-6">
				<div className="text-center space-y-2">
					<p className="font-bold text-lg">Share this story</p>
					<p className="text-sm text-muted-foreground">
						Loved what you read? Help others discover it too.
					</p>
				</div>
				<SocialShare url={`/blogs/${blog.slug}`} title={blog.title} />

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

			{/* Comments Section */}
			<CommentSection
				blogId={blog._id}
				slug={blog.slug}
				blogAuthorId={blog.authorId?._id?.toString()}
				initialComments={[]}
				initialHasMore={totalComments > 0}
				total={totalComments}
				user={session?.user}
				limit={commentLimit}
				latestComment={latestComment}
			/>

			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify([
						{
							"@context": "https://schema.org",
							"@type": "BlogPosting",
							headline: blog.title,
							description: blog.metaDescription || blog.excerpt,
							image: blog.coverImage ? [blog.coverImage] : [],
							datePublished: blog.createdAt,
							dateModified: blog.updatedAt || blog.createdAt,
							author: [
								{
									"@type": "Person",
									name: blog.authorId?.name || "Deleted User",
									image: blog.authorId?.image,
								},
							],
							mainEntityOfPage: {
								"@type": "WebPage",
								"@id": `${process.env.NEXT_PUBLIC_APP_URL}/blogs/${blog.slug}`,
							},
						},
						{
							"@context": "https://schema.org",
							"@type": "BreadcrumbList",
							itemListElement: [
								{
									"@type": "ListItem",
									position: 1,
									name: "Home",
									item: `${process.env.NEXT_PUBLIC_APP_URL}`,
								},
								{
									"@type": "ListItem",
									position: 2,
									name: "Blogs",
									item: `${process.env.NEXT_PUBLIC_APP_URL}/`,
								},
								{
									"@type": "ListItem",
									position: 3,
									name: blog.title,
									item: `${process.env.NEXT_PUBLIC_APP_URL}/blogs/${blog.slug}`,
								},
							],
						},
					]),
				}}
			/>
		</article>
	);
}
