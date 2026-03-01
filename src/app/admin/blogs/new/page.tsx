import { BlogForm } from "@/components/admin/BlogForm";

export default function NewBlogPage() {
	return (
		<div className=" mx-auto space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Create New Blog</h1>
				<p className="text-muted-foreground">
					Write a new amazing story for your readers.
				</p>
			</div>

			<div className="bg-white dark:bg-zinc-900 border rounded-lg p-6 shadow-sm">
				<BlogForm />
			</div>
		</div>
	);
}
