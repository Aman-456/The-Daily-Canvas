import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogBySlugCached } from "@/queries/blog";
import { getApprovedCommentForPublicThread } from "@/queries/comment";
import { CommentThreadPermalink } from "@/components/client/comments/CommentThreadPermalink";
import type { PublicComment } from "@/types/comment";

export const dynamic = "force-dynamic";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string; commentId: string }>;
}): Promise<Metadata> {
	const { slug, commentId } = await params;
	const blog = await getBlogBySlugCached(slug);
	if (!blog) return { title: "Thread" };
	const row = await getApprovedCommentForPublicThread(blog.id, commentId);
	if (!row) return { title: "Thread", robots: { index: false } };
	return {
		title: `Thread — ${blog.title}`,
		description: `Comment thread on “${blog.title}”.`,
		robots: { index: false, follow: true },
	};
}

export default async function BlogCommentThreadPage({
	params,
}: {
	params: Promise<{ slug: string; commentId: string }>;
}) {
	const { slug, commentId } = await params;
	const blog = await getBlogBySlugCached(slug);
	if (!blog) notFound();

	const row = await getApprovedCommentForPublicThread(blog.id, commentId);
	if (!row) notFound();

	const initialComment = JSON.parse(JSON.stringify(row)) as PublicComment;

	return (
		<div className="mx-auto max-w-3xl pb-16 pt-6">
			<Link
				href={`/blogs/${slug}`}
				className="mb-6 inline-flex items-center px-2 text-sm font-medium text-muted-foreground hover:text-primary sm:px-0"
			>
				<span className="mr-2">←</span>
				Back to post
			</Link>

			<CommentThreadPermalink
				blogId={blog.id}
				slug={blog.slug}
				blogTitle={blog.title}
				blogAuthorId={blog.authorId?.id}
				initialComment={initialComment}
			/>
		</div>
	);
}
