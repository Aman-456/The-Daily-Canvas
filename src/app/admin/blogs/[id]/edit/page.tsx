
import { notFound } from "next/navigation";
import { BlogForm } from "@/components/admin/BlogForm";
import { getCachedAdminBlogEdit } from "@/actions/blog";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default async function EditBlogPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const blog = await getCachedAdminBlogEdit(id);

	if (!blog) {
		notFound();
	}

	// Need to parse stringified object to cross Server-Client boundary safely
	const initialData = JSON.parse(JSON.stringify(blog));

	return (
		<div className="mx-auto space-y-6">
			<AdminPageHeader
				title="Edit blog"
				description="Update the contents of your blog post."
			/>

			<div className="bg-white dark:bg-zinc-900 border rounded-lg p-6 shadow-sm">
				<BlogForm initialData={initialData} blogId={id} />
			</div>
		</div>
	);
}
