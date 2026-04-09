export const dynamic = "force-dynamic";

import Link from "next/link";
import { User as UserIcon, MessageSquare } from "lucide-react";
import { CommentActionButtons } from "@/components/admin/CommentActionButtons";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { getCachedComments } from "@/actions/comment";
import { checkPermission, PERMISSIONS } from "@/lib/permissions";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminListPageShell } from "@/components/admin/AdminListPageShell";
import { AdminToolbarCount } from "@/components/admin/AdminToolbarCount";

export default async function AdminCommentsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { session, authorized } = await checkPermission(PERMISSIONS.MANAGE_COMMENTS);

	if (!authorized) {
		return <AccessDenied requiredPermission="canManageComments" />;
	}
	const params = await searchParams;
	const page = parseInt(params.page as string) || 1;
	const search = (params.search as string) || "";
	const status = (params.status as string) || "all";
	const sort = (params.sort as string) || "created_desc";
	const { comments, totalPages, total } = await getCachedComments(
		page,
		20,
		search,
		session?.user?.id,
		session?.user?.role,
		session?.user?.permissions,
		{ status, sort },
	);

	return (
		<AdminListPageShell
			className="space-y-8 animate-in fade-in duration-500"
			title="Comments"
			description="Review and manage all user responses across your blog."
			toolbar={
				<div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between xl:gap-6">
					<div className="flex min-w-0 flex-1 flex-col gap-4 xl:flex-row xl:items-end xl:gap-6">
						<div className="w-full min-w-0 xl:max-w-md xl:flex-1">
							<AdminSearch
								placeholder="Search comments or blog…"
								className="max-w-none shadow-none"
							/>
						</div>
						<AdminFilters
							className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-3"
							filters={[
								{
									key: "status",
									label: "Status",
									defaultValue: "all",
									options: [
										{ value: "all", label: "All" },
										{ value: "approved", label: "Approved" },
										{ value: "pending", label: "Pending" },
									],
								},
								{
									key: "sort",
									label: "Sort by",
									defaultValue: "created_desc",
									options: [
										{ value: "created_desc", label: "Newest first" },
										{ value: "created_asc", label: "Oldest first" },
									],
								},
							]}
						/>
					</div>
					<AdminToolbarCount count={total} unit="responses" />
				</div>
			}
		>
			<div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-gray-50/50 dark:bg-zinc-800/50 text-muted-foreground">
								<th className="p-4 text-xs font-bold uppercase tracking-wider">
									Author
								</th>
								<th className="p-4 text-xs font-bold uppercase tracking-wider">
									Content
								</th>
								<th className="p-4 text-xs font-bold uppercase tracking-wider">
									Blog Post
								</th>
								<th className="p-4 text-xs font-bold uppercase tracking-wider">
									Status
								</th>
								<th className="p-4 text-xs font-bold uppercase tracking-wider text-right">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
							{comments.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="p-12 text-center text-muted-foreground text-sm italic"
									>
										No comments found yet.
									</td>
								</tr>
							) : (
								comments.map((comment: any) => (
									<tr
										key={comment._id}
										className="group hover:bg-gray-50/30 dark:hover:bg-zinc-800/30 transition-colors"
									>
										<td className="p-4 align-top">
											<div className="flex items-center gap-3">
												<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
													<UserIcon size={14} />
												</div>
												<div>
													<p className="text-sm font-semibold">
														{comment.userId?.name || "Unknown"}
													</p>
													<p className="text-[11px] text-muted-foreground">
														{comment.userId?.email}
													</p>
												</div>
											</div>
										</td>
										<td className="p-4 align-top max-w-sm">
											<div className="space-y-1">
												<p className="text-sm leading-relaxed line-clamp-3">
													{comment.content}
												</p>
												<div className="flex items-center gap-2">
													<p className="text-[10px] text-muted-foreground">
														{new Date(comment.createdAt).toLocaleDateString()}
														{comment.isEdited && (
															<span className="ml-1 italic font-medium">
																(edited)
															</span>
														)}
													</p>
													{comment.parentId && (
														<span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-tighter bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
															Reply
														</span>
													)}
												</div>
											</div>
										</td>
										<td className="p-4 align-top">
											<Link
												href={`/blogs/${comment.blogId?.slug}`}
												className="text-xs font-medium text-primary hover:underline transition-all flex items-center gap-1.5 truncate max-w-[150px]"
											>
												<MessageSquare size={12} className="shrink-0" />
												{comment.blogId?.title || "Deleted Post"}
											</Link>
										</td>
										<td className="p-4 align-top">
											<div className="flex items-center">
												{comment.isApproved ? (
													<span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
														Approved
													</span>
												) : (
													<span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
														Pending
													</span>
												)}
											</div>
										</td>
										<td className="p-4 align-top">
											<div className="opacity-0 group-hover:opacity-100 transition-opacity">
												<CommentActionButtons
													commentId={comment._id}
													blogId={comment.blogId?._id || ""}
													isApproved={comment.isApproved}
												/>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			<AdminPagination totalPages={totalPages} currentPage={page} />
		</AdminListPageShell>
	);
}
