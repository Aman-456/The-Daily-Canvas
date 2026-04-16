export const dynamic = "force-dynamic";

import Link from "next/link";
import { AdminListPageShell } from "@/components/admin/AdminListPageShell";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminToolbarCount } from "@/components/admin/AdminToolbarCount";
import { checkPermission, PERMISSIONS } from "@/lib/permissions";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { getModerationQueue } from "@/queries/moderation";
import { Button } from "@/components/ui/button";
import { setArticleHidden, setCommentHidden } from "@/actions/report";
import { resolveReports } from "@/actions/moderation";

export default async function AdminModerationPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { authorized } = await checkPermission(PERMISSIONS.MANAGE_COMMENTS);
	if (!authorized) {
		return <AccessDenied requiredPermission="canManageComments" />;
	}

	const sp = await searchParams;
	const page = typeof sp.page === "string" ? Number(sp.page) : 1;
	const type = (typeof sp.type === "string" ? sp.type : "comments") as
		| "articles"
		| "comments";
	const status = (typeof sp.status === "string" ? sp.status : "open") as
		| "open"
		| "resolved"
		| "all";

	const { items, total, totalPages } = await getModerationQueue({
		type,
		status,
		page,
		limit: 20,
	});

	return (
		<AdminListPageShell
			className="space-y-8 animate-in fade-in duration-500"
			title="Moderation"
			description="Review reported articles and comments. Items may auto-hide after repeated reports."
			toolbar={
				<div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between xl:gap-6">
					<div className="flex min-w-0 flex-1 flex-col gap-4 xl:flex-row xl:items-end xl:gap-6">
						<AdminFilters
							className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-3"
							filters={[
								{
									key: "type",
									label: "Type",
									defaultValue: "comments",
									options: [
										{ value: "comments", label: "Comments" },
										{ value: "articles", label: "Articles" },
									],
								},
								{
									key: "status",
									label: "Status",
									defaultValue: "open",
									options: [
										{ value: "open", label: "Open" },
										{ value: "resolved", label: "Resolved" },
										{ value: "all", label: "All" },
									],
								},
							]}
						/>
					</div>
					<AdminToolbarCount count={total} unit="items" />
				</div>
			}
		>
			<div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-gray-50/50 dark:bg-zinc-800/50 text-muted-foreground">
								<th className="p-4 text-xs font-bold uppercase tracking-wider">
									Target
								</th>
								<th className="p-4 text-xs font-bold uppercase tracking-wider">
									Reports
								</th>
								<th className="p-4 text-xs font-bold uppercase tracking-wider">
									Hidden
								</th>
								<th className="p-4 text-xs font-bold uppercase tracking-wider text-right">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
							{items.length === 0 ? (
								<tr>
									<td
										colSpan={4}
										className="p-12 text-center text-muted-foreground text-sm italic"
									>
										No items in the moderation queue.
									</td>
								</tr>
							) : type === "articles" ? (
								(items as any[]).map((row) => (
									<tr
										key={row.blogId}
										className="group hover:bg-gray-50/30 dark:hover:bg-zinc-800/30 transition-colors"
									>
										<td className="p-4">
											<div className="space-y-0.5">
												<p className="font-medium">{row.blogTitle}</p>
												{row.blogSlug ? (
													<Link
														href={`/articles/${row.blogSlug}`}
														className="text-xs text-primary underline-offset-4 hover:underline"
													>
														View article →
													</Link>
												) : null}
											</div>
										</td>
										<td className="p-4 text-sm tabular-nums">{row.openReports}</td>
										<td className="p-4 text-sm">
											{row.isHidden ? "Yes" : "No"}
										</td>
										<td className="p-4 text-right">
											<div className="inline-flex items-center gap-2">
												<form
													action={async () => {
														"use server";
														await setArticleHidden({
															blogId: row.blogId,
															hidden: !row.isHidden,
														});
													}}
												>
													<Button variant="outline" size="sm">
														{row.isHidden ? "Unhide" : "Hide"}
													</Button>
												</form>
												<form
													action={async () => {
														"use server";
														await resolveReports({
															type: "articles",
															targetId: row.blogId,
														});
													}}
												>
													<Button variant="ghost" size="sm">
														Resolve
													</Button>
												</form>
											</div>
										</td>
									</tr>
								))
							) : (
								(items as any[]).map((row) => (
									<tr
										key={row.commentId}
										className="group hover:bg-gray-50/30 dark:hover:bg-zinc-800/30 transition-colors"
									>
										<td className="p-4">
											<div className="space-y-0.5">
												<p className="line-clamp-2 text-sm">
													{row.commentPreview || "(no content)"}
												</p>
												{row.blogSlug ? (
													<Link
														href={`/articles/${row.blogSlug}`}
														className="text-xs text-primary underline-offset-4 hover:underline"
													>
														View article →
													</Link>
												) : null}
											</div>
										</td>
										<td className="p-4 text-sm tabular-nums">{row.openReports}</td>
										<td className="p-4 text-sm">
											{row.isHidden ? "Yes" : "No"}
										</td>
										<td className="p-4 text-right">
											<div className="inline-flex items-center gap-2">
												<form
													action={async () => {
														"use server";
														await setCommentHidden({
															commentId: row.commentId,
															hidden: !row.isHidden,
														});
													}}
												>
													<Button variant="outline" size="sm">
														{row.isHidden ? "Unhide" : "Hide"}
													</Button>
												</form>
												<form
													action={async () => {
														"use server";
														await resolveReports({
															type: "comments",
															targetId: row.commentId,
														});
													}}
												>
													<Button variant="ghost" size="sm">
														Resolve
													</Button>
												</form>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
				<div className="p-4 border-t border-gray-100 dark:border-zinc-800">
					<AdminPagination currentPage={page} totalPages={totalPages} />
				</div>
			</div>
		</AdminListPageShell>
	);
}

