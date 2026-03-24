"use server";

import dbConnect from "@/lib/mongoose";
import Blog from "@/models/Blog";
import { auth } from "@/auth";
import { isAdminOrSubAdmin, isSubAdmin } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { unstable_cache } from "next/cache";

import Comment from "@/models/Comment";

export const getCachedBlogs = unstable_cache(
	async (query: any, skip: number, limit: number) => {
		await dbConnect();
		return Promise.all([
			Blog.find(query)
				.sort({ createdAt: -1 })
				.populate("authorId", "name")
				.skip(skip)
				.limit(limit)
				.lean(),
			Blog.countDocuments(query),
		]);
	},
	["admin-blogs-list"],
	{ revalidate: 86400, tags: ["blogs"] } // 1 day
);

export const getCachedAdminBlogDetails = unstable_cache(
	async (id: string) => {
		await dbConnect();
		return Blog.findById(id).populate("authorId", "name").lean();
	},
	["admin-blog-details-query"],
	{ revalidate: 86400, tags: ["blogs"] }
);

export const getCachedAdminBlogEdit = unstable_cache(
	async (id: string) => {
		await dbConnect();
		return Blog.findById(id).lean();
	},
	["admin-blog-edit-query"],
	{ revalidate: 86400, tags: ["blogs"] }
);

import { blogSchema } from "@/lib/validations/blog";
import { UploadService } from "@/lib/upload";
import { pingIndexNow } from "@/lib/indexnow";

export async function createBlog(formData: FormData) {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Unauthorized" };

		const rawData = {
			title: formData.get("title"),
			content: formData.get("content"),
			excerpt: formData.get("excerpt"),
			coverImage: formData.get("coverImage"),
			isPublished: formData.get("isPublished") === "true",
			metaTitle: formData.get("metaTitle"),
			metaDescription: formData.get("metaDescription"),
			keywords: formData.get("keywords"),
		};

		const parsed = blogSchema.safeParse(rawData);
		if (!parsed.success) {
			return { success: false, error: parsed.error.issues[0].message };
		}

		const {
			title,
			content,
			excerpt,
			coverImage,
			isPublished,
			metaTitle,
			metaDescription,
			keywords,
		} = parsed.data;

		const slug =
			slugify(title, { lower: true, strict: true }) +
			"-" +
			Date.now().toString().slice(-4);

		await dbConnect();

		const newBlog = await Blog.create({
			title,
			slug,
			content,
			excerpt,
			coverImage,
			isPublished,
			authorId: session.user.id,
			metaTitle,
			metaDescription,
			keywords,
		});

		// Invalidate cache natively
		revalidatePath("/");
		revalidatePath("/admin/blogs");

		// Auto-ping IndexNow for SEO if it is published
		if (isPublished) {
			await pingIndexNow(slug);
		}

		return { success: true, data: JSON.parse(JSON.stringify(newBlog)) };
	} catch (error: any) {
		console.error("[createBlog] Error:", error);
		return {
			success: false,
			error: error.message || "An unexpected error occurred",
		};
	}
}

export async function deleteBlog(id: string) {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Unauthorized" };

		const role = session.user.role as string;

		await dbConnect();
		const blog = await Blog.findById(id);

		if (!blog) return { success: false, error: "Blog not found" };

		// Sub-admins can only delete their own blogs, Admins can delete any
		if (isSubAdmin(role) && blog.authorId.toString() !== session.user.id) {
			return {
				success: false,
				error: "Forbidden: You can only delete your own blogs",
			};
		}
		if (!isAdminOrSubAdmin(role)) {
			return { success: false, error: "Unauthorized" };
		}

		// Delete old cover image from Vercel Blob if it exists
		if (blog.coverImage) {
			await UploadService.delete(blog.coverImage);
		}

		const slugToPing = blog.slug;

		await Blog.findByIdAndDelete(id);
		await Comment.deleteMany({ blogId: id });

		revalidatePath("/");
		revalidatePath("/admin/blogs");

		// Notify search engines that the URL is dead
		await pingIndexNow(slugToPing);

		return { success: true };
	} catch (error: any) {
		console.error("[deleteBlog] Error:", error);
		return {
			success: false,
			error: error.message || "An unexpected error occurred",
		};
	}
}

export async function updateBlog(id: string, formData: FormData) {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Unauthorized" };

		const rawData = {
			title: formData.get("title"),
			content: formData.get("content"),
			excerpt: formData.get("excerpt"),
			coverImage: formData.get("coverImage"),
			isPublished: formData.get("isPublished") === "true",
			metaTitle: formData.get("metaTitle"),
			metaDescription: formData.get("metaDescription"),
			keywords: formData.get("keywords"),
		};

		const oldCoverImage = formData.get("oldCoverImage") as string | null;

		const parsed = blogSchema.safeParse(rawData);
		if (!parsed.success) {
			return { success: false, error: parsed.error.issues[0].message };
		}

		const {
			title,
			content,
			excerpt,
			coverImage,
			isPublished,
			metaTitle,
			metaDescription,
			keywords,
		} = parsed.data;

		await dbConnect();
		const blog = await Blog.findById(id);
		if (!blog) return { success: false, error: "Blog not found" };

		// Check permissions
		const role = session.user.role as string;
		if (isSubAdmin(role) && blog.authorId.toString() !== session.user.id) {
			return {
				success: false,
				error: "Forbidden: You can only edit your own blogs",
			};
		}
		if (!isAdminOrSubAdmin(role)) {
			return { success: false, error: "Unauthorized" };
		}

		// If cover image changed, delete the old one from Vercel Blob
		if (oldCoverImage && oldCoverImage !== coverImage) {
			await UploadService.delete(oldCoverImage);
		}

		const newSlug =
			slugify(title, { lower: true, strict: true }) +
			"-" +
			id.toString().slice(-4);

		const updatedBlog = await Blog.findByIdAndUpdate(
			id,
			{
				title,
				slug: newSlug,
				content,
				excerpt,
				coverImage,
				isPublished,
				metaTitle,
				metaDescription,
				keywords,
			},
			{ new: true },
		);

		// Invalidate natively
		revalidatePath("/");
		revalidatePath(`/blogs/${newSlug}`);
		revalidatePath("/admin/blogs");

		// Auto-ping IndexNow for SEO if it is published
		if (isPublished) {
			await pingIndexNow(newSlug);
		}

		return { success: true, data: JSON.parse(JSON.stringify(updatedBlog)) };
	} catch (error: any) {
		console.error("[updateBlog] Error:", error);
		return {
			success: false,
			error: error.message || "An unexpected error occurred",
		};
	}
}
