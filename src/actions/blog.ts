"use server";

import dbConnect from "@/lib/mongoose";
import Blog from "@/models/Blog";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { unstable_cache } from "next/cache";

import Comment from "@/models/Comment";
import Notification from "@/models/Notification";

async function fetchBlogsList(query: any, skip: number, limit: number, userId?: string, role?: string, permissions?: any) {
	await dbConnect();
	let finalQuery = { ...query };

	const isOwnerOnly = role === "USER";

	if (isOwnerOnly && userId) {
		finalQuery.authorId = userId;
	}

	return Promise.all([
		Blog.find(finalQuery)
			.sort({ createdAt: -1 })
			.populate("authorId", "name")
			.skip(skip)
			.limit(limit)
			.lean(),
		Blog.countDocuments(finalQuery),
	]);
}

const getCachedBlogsList = unstable_cache(
	fetchBlogsList,
	["admin-blogs-list"],
	{ revalidate: 86400, tags: ["blogs"] }
);

export const getCachedBlogs = async (query: any, skip: number, limit: number, userId?: string, role?: string, permissions?: any) => {
	const isAdminLevel = role === "ADMIN";
	
	if (isAdminLevel) {
		return getCachedBlogsList(query, skip, limit, userId, role, permissions);
	} else {
		return fetchBlogsList(query, skip, limit, userId, role, permissions);
	}
};

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

		// Notify admins of new blog
		try {
			await Notification.create({
				message: `New blog created: "${title}"`,
				link: `/admin/blogs/${newBlog._id}`,
				blogLink: `/admin/blogs/${newBlog._id}`,
				type: "BLOG_PUBLISHED", // Or a new NEW_BLOG type, but PUBLISHED fits if it's published
				userId: session.user.id,
				targetAuthorId: session.user.id
			});
		} catch (err) {
			console.error("Failed to create notification for new blog:", err);
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

import { hasPermission } from "@/lib/utils";

export async function deleteBlog(id: string) {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Unauthorized" };

		await dbConnect();
		const blog = await Blog.findById(id);

		if (!blog) return { success: false, error: "Blog not found" };

		const isOwner = blog.authorId.toString() === session.user.id;
		const canManageOtherBlogs = session.user.role === "ADMIN";

		if (!isOwner && !canManageOtherBlogs) {
			return {
				success: false,
				error: "Forbidden: You don't have permission to delete this blog",
			};
		}

		// Delete old cover image from Vercel Blob if it exists
		if (blog.coverImage) {
			await UploadService.delete(blog.coverImage);
		}

		const slugToPing = blog.slug;

		await Blog.findByIdAndDelete(id);
		await Comment.deleteMany({ blogId: id });

		// Notify author if deleted by someone else
		if (!isOwner) {
			try {
				await Notification.create({
					message: `Your blog "${blog.title}" was deleted by an administrator.`,
					link: "/admin/blogs",
					blogLink: "/admin/blogs",
					type: "BLOG_DELETE",
					userId: session.user.id,
					targetAuthorId: blog.authorId
				});
			} catch (err) {
				console.error("Failed to notify author of deletion:", err);
			}
		}

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
		const isOwner = blog.authorId.toString() === session.user.id;
		const canManageOtherBlogs = session.user.role === "ADMIN";

		if (!isOwner && !canManageOtherBlogs) {
			return {
				success: false,
				error: "Forbidden: You don't have permission to edit this blog",
			};
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

		// Notifications for admin-initiated actions on user's blog
		if (!isOwner) {
			try {
				let notifType: any = "BLOG_UPDATE";
				let msg = `Your blog "${title}" was updated by an administrator.`;

				if (blog.isPublished !== isPublished) {
					notifType = isPublished ? "BLOG_PUBLISHED" : "BLOG_UNPUBLISHED";
					msg = `Your blog "${title}" was ${isPublished ? "published" : "unpublished"} by an administrator.`;
				}

				await Notification.create({
					message: msg,
					link: `/admin/blogs`,
					blogLink: `/admin/blogs/${id}`,
					type: notifType,
					userId: session.user.id,
					targetAuthorId: blog.authorId
				});
			} catch (err) {
				console.error("Failed to notify author of update:", err);
			}
		}

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
