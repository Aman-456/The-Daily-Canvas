export const dynamic = "force-dynamic";

import { auth } from "@/auth";

import { isAdmin } from "@/lib/utils";
import { checkPermission, PERMISSIONS } from "@/lib/permissions";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { redirect } from "next/navigation";

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
import { CopyIcon, Grid, List as ListIcon } from "lucide-react";
import { getCachedBlogs } from "@/actions/blog";
import Image from "next/image";
import { Blog, BlogWithAuthor } from "@/db/schema";
import { AdminFilters } from "@/components/admin/AdminFilters";

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

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Manage Blogs</h1>
					<p className="text-muted-foreground">
						Create, edit, and delete blog posts.
					</p>
				</div>
				<Link href="/admin/blogs/new">
					<Button>Create Post</Button>
				</Link>
			</div>

			<div className="flex items-center justify-between gap-4">
				<AdminSearch placeholder="Search blogs..." />
				<div className="flex items-center gap-4">
					<AdminFilters
						className="hidden md:flex items-center gap-3"
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
								label: "Sort",
								defaultValue: "created_desc",
								options: [
									{ value: "created_desc", label: "Date (newest)" },
									{ value: "created_asc", label: "Date (oldest)" },
									{ value: "views_desc", label: "Views (high→low)" },
									{ value: "comments_desc", label: "Comments (high→low)" },
								],
							},
						]}
					/>
					<div className="flex border rounded-md overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
						<Link href={`?page=${page}&search=${search}&status=${status}&sort=${sort}&view=table`}>
							<Button variant={view === "table" ? "secondary" : "ghost"} size="icon" className="rounded-none w-10 h-10">
								<ListIcon className="h-4 w-4" />
							</Button>
						</Link>
						<Link href={`?page=${page}&search=${search}&status=${status}&sort=${sort}&view=grid`}>
							<Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="rounded-none w-10 h-10 border-l">
								<Grid className="h-4 w-4" />
							</Button>
						</Link>
					</div>
					<div className="text-sm text-muted-foreground mr-2">Total: {total}</div>
				</div>
			</div>

			{view === "table" ? (
				<div className="bg-white dark:bg-zinc-900 border rounded-lg shadow-sm">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Title</TableHead>
								<TableHead>Author</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Date</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{blogs.map((blog: BlogWithAuthor) => (
								<TableRow key={blog.id}>
									<TableCell className="font-medium">{blog.title}</TableCell>
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
									<TableCell className="text-right space-x-2">
										<Link href={`/admin/blogs/${blog.id}`}>
											<Button
												variant="outline"
												size="sm"
											>
												Details
											</Button>
										</Link>
										<Link href={`/admin/blogs/${blog.id}/edit`}>
											<Button
												variant="outline"
												size="sm"
											>
												Edit
											</Button>
										</Link>
										<DeleteBlogButton blogId={blog.id} />
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
		</div>
	);
}
