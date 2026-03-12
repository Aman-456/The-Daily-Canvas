import dbConnect from "@/lib/mongoose";
import Blog from "@/models/Blog";
import { notFound } from "next/navigation";
import { BlogForm } from "@/components/admin/BlogForm";

export default async function EditBlogPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	await dbConnect();
	const blog = await Blog.findById(id).lean();

	if (!blog) {
		notFound();
	}

	// Need to parse stringified object to cross Server-Client boundary safely
	const initialData = JSON.parse(JSON.stringify(blog));

	return (
		<div className="mx-auto space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Edit Blog</h1>
				<p className="text-muted-foreground">
					Update the contents of your blog post.
				</p>
			</div>

			<div className="bg-white dark:bg-zinc-900 border rounded-lg p-6 shadow-sm">
				<BlogForm initialData={initialData} blogId={id} />
			</div>
		</div>
	);
}
