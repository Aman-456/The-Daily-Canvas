"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPageBySlug, updateAdminPage } from "@/actions/page";
import { toast } from "sonner";
import InitializedMDXEditor from "@/components/admin/Editor/InitializedMDXEditor";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function EditPage({ params }: { params: Promise<{ slug: string }> }) {
	const resolvedParams = use(params);
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		async function load() {
			const result = await getPageBySlug(resolvedParams.slug);
			if (result.success && result.data) {
				setTitle(result.data.title);
				setContent(result.data.content);
			} else {
				toast.error("Failed to load page");
				router.push("/admin/pages");
			}
			setLoading(false);
		}
		load();
	}, [resolvedParams.slug, router]);

	const handleSave = async () => {
		setSaving(true);
		const result = await updateAdminPage(resolvedParams.slug, content, title);
		if (result.success) {
			toast.success("Page updated successfully");
			router.push("/admin/pages");
			router.refresh();
		} else {
			toast.error(result.error || "Failed to update page");
		}
		setSaving(false);
	};

	if (loading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="max-w-4xl space-y-6">
			<AdminPageHeader
				title={title ? `Edit: ${title}` : "Edit page"}
				description="Update CMS page content and title."
				actions={
					<Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
						{saving ? "Saving…" : "Save changes"}
					</Button>
				}
			/>

			<div className="space-y-4">
				<div className="space-y-2">
					<label className="text-sm font-medium">Title</label>
					<Input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Page Title"
					/>
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium">Content</label>
					<div className="min-h-[500px] border rounded-md overflow-hidden bg-white dark:bg-zinc-950">
						<InitializedMDXEditor
							markdown={content}
							onChange={setContent}
							editorRef={null}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
