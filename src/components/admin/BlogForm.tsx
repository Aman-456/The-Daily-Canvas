"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBlog, updateBlog } from "@/actions/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UploadService } from "@/lib/upload";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { type MDXEditorMethods } from "@mdxeditor/editor";
import { ForwardRefEditor } from "@/components/admin/Editor/ForwardRefEditor";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface BlogFormProps {
	initialData?: any;
	blogId?: string;
}

export function BlogForm({ initialData, blogId }: BlogFormProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [content, setContent] = useState(initialData?.content || "");
	const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || "");
	const [metaDescription, setMetaDescription] = useState(
		initialData?.metaDescription || "",
	);
	const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
	const [coverImageUrl, setCoverImageUrl] = useState(
		initialData?.coverImage || "",
	);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const editorRef = useRef<MDXEditorMethods>(null);

	const isContentEmpty = content.trim().length === 0;

	// Called by MDXEditor when user inserts an image via toolbar
	const handleEditorImageUpload = async (file: File): Promise<string> => {
		const optimized = await UploadService.optimizeImage(file);
		const url = await UploadService.upload(optimized);
		return url;
	};

	const handleCoverImageUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Please select a valid image file.");
			return;
		}
		setUploading(true);
		try {
			const optimized = await UploadService.optimizeImage(file);
			const url = await UploadService.upload(optimized);
			setCoverImageUrl(url);
			toast.success("Cover image uploaded!");
		} catch (error: any) {
			toast.error(error.message || "Failed to upload image");
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleRemoveImage = () => {
		setCoverImageUrl("");
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (isContentEmpty) {
			toast.error("Please add some content to your post before publishing.");
			return;
		}

		setLoading(true);
		const formData = new FormData(e.currentTarget);
		formData.set("content", content);
		formData.set("coverImage", coverImageUrl);
		if (initialData?.coverImage) {
			formData.set("oldCoverImage", initialData.coverImage);
		}

		try {
			if (initialData && blogId) {
				await updateBlog(blogId, formData);
				toast.success("Blog updated successfully!");
			} else {
				await createBlog(formData);
				toast.success("Blog created successfully!");
			}
			router.push("/admin/blogs");
			router.refresh();
		} catch (error: any) {
			toast.error(error.message || "Failed to save blog");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">
						{initialData ? "Edit Post" : "Create New Post"}
					</h2>
					<p className="text-muted-foreground">
						{initialData
							? "Modify your existing blog post details."
							: "Draft a new story for your audience."}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button
						type="button"
						variant="ghost"
						onClick={() => router.back()}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						size="lg"
						disabled={loading || uploading}
						className="px-8"
					>
						{loading
							? "Saving..."
							: initialData
								? "Update Post"
								: "Publish Post"}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Main Content Column */}
				<div className="lg:col-span-2 space-y-6">
					<Card className="shadow-sm overflow-hidden border border-muted/60 py-0">
						<CardHeader className="bg-muted/30 border-b py-4">
							<CardTitle className="text-base font-semibold">
								Post Content
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<ForwardRefEditor
								ref={editorRef}
								markdown={content}
								onChange={setContent}
								imageUploadHandler={handleEditorImageUpload}
								contentEditableClassName="min-h-[450px] px-6 py-4 prose prose-sm dark:prose-invert max-w-none focus:outline-none"
								className="w-full"
							/>
						</CardContent>
					</Card>

					<Card className="shadow-sm border-muted/60 pt-0">
						<CardHeader className="py-4 border-b bg-muted/30">
							<CardTitle className="text-base font-semibold">
								SEO & Metadata
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-5">
							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<Label htmlFor="metaTitle">Search Title (Optional)</Label>
									<span
										className={`text-[10px] font-medium ${
											metaTitle.length >= 60
												? "text-destructive font-bold"
												: metaTitle.length > 50
													? "text-amber-500"
													: "text-muted-foreground"
										}`}
									>
										{metaTitle.length}/60
									</span>
								</div>
								<Input
									id="metaTitle"
									name="metaTitle"
									value={metaTitle}
									onChange={(e) => setMetaTitle(e.target.value)}
									placeholder="SEO-friendly title"
									maxLength={60}
									className="bg-muted/10 h-10"
								/>
								<p className="text-[11px] text-muted-foreground px-1">
									Recommended: under 60 characters
								</p>
							</div>

							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<Label htmlFor="metaDescription">Search Description</Label>
									<span
										className={`text-[10px] font-medium ${
											metaDescription.length >= 160
												? "text-destructive font-bold"
												: metaDescription.length > 140
													? "text-amber-500"
													: "text-muted-foreground"
										}`}
									>
										{metaDescription.length}/160
									</span>
								</div>
								<Input
									id="metaDescription"
									name="metaDescription"
									value={metaDescription}
									onChange={(e) => setMetaDescription(e.target.value)}
									placeholder="Brief summary for search engines"
									maxLength={160}
									className="bg-muted/10 h-10"
								/>
								<p className="text-[11px] text-muted-foreground px-1">
									Recommended: between 140-160 characters
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="keywords">Keywords</Label>
								<Input
									id="keywords"
									name="keywords"
									defaultValue={initialData?.keywords?.join(", ")}
									placeholder="e.g. tech, design, lifestyle"
									className="bg-muted/10 h-10"
								/>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					<Card className="shadow-sm border-muted/60 pt-0">
						<CardHeader className="py-4 border-b bg-muted/30">
							<CardTitle className="text-base font-semibold">
								General Details
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-5">
							<div className="space-y-2">
								<Label htmlFor="title">Post Title</Label>
								<Input
									id="title"
									name="title"
									defaultValue={initialData?.title}
									placeholder="Enter title..."
									required
									className="bg-muted/10 h-10"
								/>
							</div>

							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<Label htmlFor="excerpt">Short Excerpt</Label>
									<span
										className={`text-[10px] font-medium ${
											excerpt.length >= 220
												? "text-destructive font-bold"
												: excerpt.length > 180
													? "text-amber-500"
													: "text-muted-foreground"
										}`}
									>
										{excerpt.length}/220
									</span>
								</div>
								<textarea
									id="excerpt"
									name="excerpt"
									value={excerpt}
									onChange={(e) => setExcerpt(e.target.value)}
									placeholder="Summarize the post..."
									rows={3}
									maxLength={220}
									className="w-full rounded-md border border-input bg-muted/10 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								/>
							</div>

							<div className="space-y-2">
								<Label>Cover Image</Label>
								{coverImageUrl ? (
									<div className="relative group rounded-lg overflow-hidden border border-muted">
										<img
											src={coverImageUrl}
											alt="Cover preview"
											className="w-full h-40 object-cover"
										/>
										<button
											type="button"
											onClick={handleRemoveImage}
											className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
											title="Remove image"
										>
											<X className="h-4 w-4" />
										</button>
									</div>
								) : (
									<div
										onClick={() => !uploading && fileInputRef.current?.click()}
										className="flex flex-col items-center justify-center gap-2 h-40 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/20 transition-colors"
									>
										{uploading ? (
											<>
												<Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
												<span className="text-sm text-muted-foreground">
													Optimizing & uploading...
												</span>
											</>
										) : (
											<>
												<ImagePlus className="h-8 w-8 text-muted-foreground" />
												<span className="text-sm text-muted-foreground">
													Click to upload cover image
												</span>
												<span className="text-[11px] text-muted-foreground/60">
													Auto-optimized to WebP
												</span>
											</>
										)}
									</div>
								)}
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleCoverImageUpload}
									className="hidden"
								/>
							</div>
						</CardContent>
					</Card>

					<Card className="shadow-sm border-muted/60 pt-0">
						<CardHeader className="py-4 border-b bg-muted/30">
							<CardTitle className="text-base font-semibold">
								Publishing Options
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/20">
								<input
									type="checkbox"
									id="isPublished"
									name="isPublished"
									value="true"
									defaultChecked={initialData?.isPublished}
									className="h-5 w-5 rounded border-muted text-primary focus:ring-primary"
								/>
								<Label
									htmlFor="isPublished"
									className="font-semibold cursor-pointer"
								>
									Published Status
								</Label>
							</div>
							<p className="mt-3 text-[12px] text-muted-foreground px-1">
								If unchecked, the post will remain a draft and won't be visible
								to readers.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</form>
	);
}
