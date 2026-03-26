
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit2, ExternalLink, Eye } from "lucide-react";
import { CommentSection } from "@/components/client/CommentSection";
import { auth } from "@/auth";
import { DeleteAllCommentsButton } from "@/components/admin/DeleteAllCommentsButton";
import { getLatestRootComment } from "@/queries/comment";
import { getCachedAdminBlogDetails } from "@/actions/blog";
import { Metadata } from "next";

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

	const session = await auth();
	const totalComments = (blog as any).commentsCount || 0;
	const latestComment =
		totalComments > 0 ? await getLatestRootComment((blog as any)._id) : null;

	return (
		<div className="mx-auto space-y-8 pb-20">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">{blog.title}</h1>
					<p className="text-muted-foreground mt-1">
						By {blog.authorId?.name} •{" "}
						{new Date(blog.createdAt).toLocaleDateString()}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<Link href={`/blogs/${blog.slug}`} target="_blank">
						<Button
							variant="outline"
							size="sm"
							className="gap-2"
						>
							<ExternalLink className="h-4 w-4" />
							Live View
						</Button>
					</Link>
					<Link href={`/admin/blogs/${id}/edit`}>
						<Button
							variant="outline"
							size="sm"
							className="gap-2"
						>
							<Edit2 className="h-4 w-4" />
							Edit Post
						</Button>
					</Link>
					<DeleteAllCommentsButton blogId={id} slug={blog.slug} />
				</div>
			</div>

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
							initialComments={[]}
							initialHasMore={totalComments > 0}
							total={totalComments}
							user={session?.user}
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
