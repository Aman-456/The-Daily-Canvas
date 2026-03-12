import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import Blog from "@/models/Blog";
import User from "@/models/User";
void User; // Ensure Mongoose schema is registered for .populate()
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

export default async function AdminBlogsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const session = await auth();
	if (!session?.user?.id) return null;

	const role = session.user.role as string;
	const params = await searchParams;
	const page = parseInt(params.page as string) || 1;
	const search = (params.search as string) || "";
	const limit = 20;
	const skip = (page - 1) * limit;

	await dbConnect();

	let query: any = {};
	if (role === "SUBADMIN") {
		query.authorId = session.user.id;
	}

	if (search) {
		query.title = { $regex: search, $options: "i" };
	}

	const [blogs, total] = await Promise.all([
		Blog.find(query)
			.sort({ createdAt: -1 })
			.populate("authorId", "name")
			.skip(skip)
			.limit(limit)
			.lean(),
		Blog.countDocuments(query),
	]);

	const totalPages = Math.ceil(total / limit);

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
				<div className="text-sm text-muted-foreground">Total: {total}</div>
			</div>

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
						{blogs.map((blog: any) => (
							<TableRow key={blog._id.toString()}>
								<TableCell className="font-medium">{blog.title}</TableCell>
								<TableCell>{blog.authorId?.name || "Unknown"}</TableCell>
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
									<Link href={`/admin/blogs/${blog._id}`}>
										<Button
											variant="outline"
											size="sm"
											className="cursor-pointer"
										>
											Details
										</Button>
									</Link>
									<Link href={`/admin/blogs/${blog._id}/edit`}>
										<Button
											variant="outline"
											size="sm"
											className="cursor-pointer"
										>
											Edit
										</Button>
									</Link>
									<DeleteBlogButton blogId={blog._id.toString()} />
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

			<AdminPagination totalPages={totalPages} currentPage={page} />
		</div>
	);
}
