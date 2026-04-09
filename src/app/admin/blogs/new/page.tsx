import { BlogForm } from "@/components/admin/BlogForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function NewBlogPage() {
	return (
		<div className="mx-auto space-y-6">
			<AdminPageHeader
				title="Create new blog"
				description="Write a new story for your readers."
			/>

			<div className="bg-white dark:bg-zinc-900 border rounded-lg p-6 shadow-sm">
				<BlogForm />
			</div>
		</div>
	);
}
