
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit2, ExternalLink, Eye } from "lucide-react";
import { CommentSection } from "@/components/client/CommentSection";
import { DeleteAllCommentsButton } from "@/components/admin/DeleteAllCommentsButton";
import { getLatestRootComment } from "@/queries/comment";
import { getCachedAdminBlogDetails } from "@/actions/blog";
import { blogTagLabel } from "@/lib/blog-tags";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default async function AdminBlogDetailsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const blog = await getCachedAdminBlogDetails(id);

	if (!blog) {
		notFound();
	}

	const totalComments = (blog as any).commentsCount || 0;
	const latestComment =
		totalComments > 0 ? await getLatestRootComment((blog as any)._id) : null;

	return (
		<div className="mx-auto space-y-8 pb-20">
			<AdminPageHeader
				className="border-b border-border/60 pb-6"
				title={blog.title}
				description={
					<>
						By {blog.authorId?.name} •{" "}
						{new Date(blog.createdAt).toLocaleDateString()}
					</>
				}
				actions={
					<div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
						<Link href={`/articles/${blog.slug}`} target="_blank">
							<Button variant="outline" size="sm" className="gap-2">
								<ExternalLink className="h-4 w-4" />
								Live view
							</Button>
						</Link>
						<Link href={`/admin/blogs/${id}/preview`}>
							<Button variant="outline" size="sm" className="gap-2">
								<Eye className="h-4 w-4" />
								Preview
							</Button>
						</Link>
						<Link href={`/admin/blogs/${id}/edit`}>
							<Button variant="outline" size="sm" className="gap-2">
								<Edit2 className="h-4 w-4" />
								Edit post
							</Button>
						</Link>
						<DeleteAllCommentsButton blogId={id} slug={blog.slug} />
					</div>
				}
			/>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 space-y-8">
					<div className="bg-white dark:bg-zinc-900 border rounded-xl shadow-sm overflow-hidden">
						<div className="border-b px-6 py-4 bg-muted/50">
							<h2 className="font-bold flex items-center gap-2">
								<Eye className="h-4 w-4" />
								Post Information
							</h2>
						</div>
						<div className="p-6 space-y-4">
							<div>
								<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
									Excerpt
								</h3>
								<p className="mt-1 text-sm">{blog.excerpt || "No excerpt."}</p>
							</div>
							<div>
								<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
									Tags
								</h3>
								{blog.tags?.length ? (
									<div className="mt-2 flex flex-wrap gap-1.5">
										{blog.tags.map((tag) => (
											<span
												key={tag}
												className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full"
											>
												{blogTagLabel(tag)}
											</span>
										))}
									</div>
								) : (
									<p className="mt-1 text-sm text-muted-foreground">No tags.</p>
								)}
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
										Status
									</h3>
									<p className="mt-1 font-bold">
										{blog.isPublished ? "Published" : "Draft"}
									</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
										Total Comments
									</h3>
									<p className="mt-1 font-bold">{totalComments}</p>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white dark:bg-zinc-900 border rounded-xl shadow-sm p-6">
						<h2 className="text-2xl font-bold mb-8">
							Manage Community Discussion
						</h2>
						<CommentSection
							blogId={id}
							slug={blog.slug}
							initialHasMore={totalComments > 0}
							total={totalComments}
							limit={10}
							latestComment={latestComment}
						/>
					</div>
				</div>

				<div className="space-y-6">
					<div className="bg-white dark:bg-zinc-900 border rounded-xl p-6 shadow-sm">
						<h3 className="font-bold mb-4">Quick Stats</h3>
						<div className="space-y-4 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Words:</span>
								<span>{blog.content.trim().split(/\s+/).length}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Last Updated:</span>
								<span>
									{blog.updatedAt
										? new Date(blog.updatedAt).toLocaleDateString()
										: "N/A"}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
