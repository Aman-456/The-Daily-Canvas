export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCachedAdminBlogDetails } from "@/actions/blog";
import Link from "next/link";
import { MarkdownWithToc } from "@/components/blog/MarkdownWithToc";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default async function AdminBlogPreviewPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) {
		redirect(`/signin?callbackUrl=${encodeURIComponent("/admin/blogs")}`);
	}

	const { id } = await params;
	const blog = await getCachedAdminBlogDetails(id);
	if (!blog) notFound();

	if (blog.authorId?.id !== session.user.id && session.user.role !== "ADMIN") {
		redirect("/admin");
	}

	return (
		<div className="mx-auto space-y-8 pb-20">
			<AdminPageHeader
				className="border-b border-border/60 pb-6"
				title={`Preview: ${blog.title}`}
				description="Draft preview (not publicly visible unless published)."
				actions={
					<div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
						<Link href={`/admin/blogs/${id}/edit`}>
							<span className="text-sm font-medium text-primary underline-offset-4 hover:underline">
								← Back to editor
							</span>
						</Link>
					</div>
				}
			/>

			<article className="mx-auto min-w-0 max-w-3xl space-y-10">
				{blog.coverImage ? (
					<img
						src={blog.coverImage}
						alt=""
						loading="eager"
						decoding="async"
						referrerPolicy="no-referrer"
						className="w-full rounded-xl border border-border/60"
					/>
				) : null}

				<MarkdownWithToc
					content={blog.content}
					className="prose prose-md sm:prose-base md:prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-28 prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl prose-pre:bg-zinc-900 prose-pre:shadow-lg leading-relaxed antialiased blog-content wrap-break-word"
				/>
			</article>
		</div>
	);
}

