export const dynamic = "force-dynamic";

import { checkPermission, PERMISSIONS } from "@/lib/permissions";
import { AccessDenied } from "@/components/admin/AccessDenied";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DeleteBlogButton } from "@/components/admin/DeleteBlogButton";
import { Badge } from "@/components/ui/badge";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Grid, List as ListIcon } from "lucide-react";
import { getCachedBlogs } from "@/actions/blog";
import Image from "next/image";
import type { BlogWithAuthor } from "@/db/schema";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminListPageShell } from "@/components/admin/AdminListPageShell";
import { AdminToolbarCount } from "@/components/admin/AdminToolbarCount";

export default async function AdminBlogsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { session, authorized } = await checkPermission(PERMISSIONS.MANAGE_BLOGS);

	if (!authorized) {
		return <AccessDenied requiredPermission="canManageBlogs" />;
	}

	// Session exists because of layout.tsx protection
	const params = await searchParams;
	const page = parseInt(params.page as string) || 1;
	const search = (params.search as string) || "";
	const status = (params.status as string) || "all";
	const sort = ((params.sort as string) || "created_desc") as
		| "created_desc"
		| "created_asc"
		| "views_desc"
		| "comments_desc";
	const limit = 12;
	const skip = (page - 1) * limit;

	let query: any = {};

	if (search) {
		query.title = { $regex: search, $options: "i" };
	}
	if (status === "published") query.isPublished = true;
	if (status === "draft") query.isPublished = false;

	const [blogs, total] = await getCachedBlogs(
		query,
		skip,
		limit,
		session?.user?.id,
		session?.user?.role,
		session?.user?.permissions,
		sort,
	);

	const totalPages = Math.ceil((total as any) / limit);
	const view = (params.view as string) || "table";

	const viewQuery = `page=${page}&search=${encodeURIComponent(search)}&status=${status}&sort=${sort}`;

	return (
		<AdminListPageShell
			title="Manage Blogs"
			description="Create, edit, and delete posts."
			actions={
				<Link href="/admin/blogs/new" className="block sm:inline-block">
					<Button className="w-full whitespace-nowrap sm:w-auto">
						Create Post
					</Button>
				</Link>
			}
			toolbar={
				<div className="flex w-full min-w-0 flex-col gap-4">
					<div className="w-full min-w-0">
						<AdminSearch
							placeholder="Search by title…"
							className="max-w-none shadow-none"
						/>
					</div>
					<div className="flex min-w-0 w-full flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
						<div className="min-w-0 lg:flex-1">
							<AdminFilters
								className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-3"
								filters={[
									{
										key: "status",
										label: "Status",
										defaultValue: "all",
										options: [
											{ value: "all", label: "All" },
											{ value: "published", label: "Published" },
											{ value: "draft", label: "Draft" },
										],
									},
									{
										key: "sort",
										label: "Sort by",
										defaultValue: "created_desc",
										options: [
											{ value: "created_desc", label: "Newest first" },
											{ value: "created_asc", label: "Oldest first" },
											{ value: "views_desc", label: "Most views" },
											{ value: "comments_desc", label: "Most comments" },
										],
									},
								]}
							/>
						</div>
						<div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3 lg:w-auto lg:shrink-0 lg:flex-nowrap lg:justify-end">
							<AdminToolbarCount count={total} unit="posts" />
							<div className="flex shrink-0 items-center gap-2">
								<span className="hidden text-xs text-muted-foreground sm:inline">
									Layout
								</span>
								<div
									className="flex shrink-0 overflow-hidden rounded-md border border-border/60 bg-background shadow-sm"
									role="group"
									aria-label="View layout"
								>
									<Link
										href={`?${viewQuery}&view=table`}
										prefetch={false}
									>
										<Button
											type="button"
											variant={view === "table" ? "secondary" : "ghost"}
											size="sm"
											className="gap-1.5 rounded-none px-3"
										>
											<ListIcon className="size-4" />
											<span className="hidden sm:inline">Table</span>
										</Button>
									</Link>
									<Link
										href={`?${viewQuery}&view=grid`}
										prefetch={false}
									>
										<Button
											type="button"
											variant={view === "grid" ? "secondary" : "ghost"}
											size="sm"
											className="gap-1.5 rounded-none border-l px-3"
										>
											<Grid className="size-4" />
											<span className="hidden sm:inline">Grid</span>
										</Button>
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			}
		>
			{view === "table" ? (
				<div className="overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-zinc-900">
					<div className="w-full overflow-x-auto">
						<Table className="min-w-[720px]">
							<TableHeader>
								<TableRow>
									<TableHead className="min-w-[200px]">Title</TableHead>
									<TableHead className="min-w-[140px]">Author</TableHead>
									<TableHead className="min-w-[100px]">Status</TableHead>
									<TableHead className="min-w-[110px]">Date</TableHead>
									<TableHead className="min-w-[200px] text-right">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{blogs.map((blog: BlogWithAuthor) => (
									<TableRow key={blog.id}>
										<TableCell className="font-medium">
											<div
												className="max-w-[340px] truncate md:max-w-[420px]"
												title={blog.title}
											>
												{blog.title}
											</div>
										</TableCell>
									<TableCell>{blog.authorId.name || "Deleted User"}</TableCell>
									<TableCell>
										{blog.isPublished ? (
											<Badge
												variant="default"
												className="bg-emerald-500 hover:bg-emerald-600"
											>
												Published
											</Badge>
										) : (
											<Badge variant="secondary">Draft</Badge>
										)}
									</TableCell>
									<TableCell>
										{new Date(blog.createdAt).toLocaleDateString()}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex flex-wrap justify-end gap-2">
											<Link href={`/admin/blogs/${blog.id}`}>
												<Button variant="outline" size="sm">
													Details
												</Button>
											</Link>
											<Link href={`/admin/blogs/${blog.id}/edit`}>
												<Button variant="outline" size="sm">
													Edit
												</Button>
											</Link>
											<DeleteBlogButton blogId={blog.id} />
										</div>
									</TableCell>
								</TableRow>
							))}
							{blogs.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={5}
										className="text-center h-24 text-muted-foreground"
									>
										No blogs found.
									</TableCell>
								</TableRow>
							)}
							</TableBody>
						</Table>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-stretch">
					{blogs.map((blog: any) => (
						<div key={blog.id} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-lg dark:hover:shadow-[0_2px_20px_rgba(0,0,0,0.2)] flex flex-col justify-between transition-all duration-300">
							<div className="flex-1 flex flex-col">
								{blog.coverImage ? (
									<Image src={blog.coverImage} alt={blog.title} width={500} height={300} className="w-full h-48 object-cover rounded-t-xl shrink-0" />
								) : (
									<div className="w-full h-48 bg-gray-100 dark:bg-zinc-800/50 flex items-center justify-center rounded-t-xl shrink-0">
										<span className="text-muted-foreground font-medium text-sm flex items-center gap-2 opacity-50">
											<ListIcon size={18} /> No Cover
										</span>
									</div>
								)}

								<div className="p-3 flex-1 flex flex-col justify-between">
									<div>
										<h3 className="font-bold text-lg text-foreground line-clamp-2 mb-4 leading-tight">{blog.title}</h3>
										<div className="flex items-center gap-2 mb-3">
											<div className="h-5 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
												{blog.authorId?.name?.charAt(0) || "U"}
											</div>
											<span className="text-sm font-medium text-muted-foreground">{blog.authorId?.name || "Deleted User"}</span>
										</div>
									</div>

									<div className="flex items-center gap-3 mt-auto">
										{blog.isPublished ? (
											<Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0 pointer-events-none rounded-full px-3 py-0.5">Published</Badge>
										) : (
											<Badge variant="secondary" className="pointer-events-none rounded-full px-3 py-0.5">Draft</Badge>
										)}
										<span className="text-xs font-medium text-muted-foreground">{new Date(blog.createdAt).toLocaleDateString()}</span>
									</div>
								</div>
							</div>
							<div className="flex items-center gap-2 p-4 bg-gray-50/50 dark:bg-zinc-800/30 border-t border-gray-100 dark:border-zinc-800/50 rounded-b-xl">
								<Link href={`/admin/blogs/${blog.id}`} className="flex-1">
									<Button variant="outline" size="sm" className="w-full bg-white dark:bg-zinc-900 shadow-sm font-medium">Details</Button>
								</Link>
								<Link href={`/admin/blogs/${blog.id}/edit`} className="flex-1">
									<Button variant="outline" size="sm" className="w-full bg-white dark:bg-zinc-900 shadow-sm font-medium">Edit</Button>
								</Link>
								<DeleteBlogButton blogId={blog.id} />
							</div>
						</div>
					))}
					{blogs.length === 0 && (
						<div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg">
							No blogs found.
						</div>
					)}
				</div>
			)}

			<AdminPagination totalPages={totalPages} currentPage={page} />
		</AdminListPageShell>
	);
}
