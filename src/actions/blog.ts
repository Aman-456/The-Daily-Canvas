"use server";

import { db } from "@/db/index";
import { blogs, users, comments, notifications, type Blog, type NewBlog } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import slugify from "slugify";
import { unstable_cache } from "next/cache";
import { eq, desc, and, sql, ilike } from "drizzle-orm";
import { blogFullSelector } from "@/db/selectors";
import { getBlogByIdCached } from "@/queries/blog";
import { blogSchema, keywordsFromFormData } from "@/lib/validations/blog";
import { UploadService } from "@/lib/upload";
import { pingIndexNow } from "@/lib/indexnow";

interface BlogQuery {
	authorId?: string;
	isPublished?: boolean;
	title?: { $regex?: string };
}

async function fetchBlogsList(
	query: BlogQuery,
	skip: number,
	limit: number,
	userId?: string,
	role?: string,
	permissions?: any
) {

	let dbQuery = db.select(blogFullSelector)
		.from(blogs)
		.leftJoin(users, eq(blogs.authorId, users.id))
		.$dynamic();

	let countQuery = db.select({ count: sql<number>`count(*)` }).from(blogs).$dynamic();

	const conditions = [];
	if (role === "ADMIN") {
		// ADMIN logic
	} else if (role === "USER" && userId) {
		conditions.push(eq(blogs.authorId, userId));
	} else if (query.authorId) {
		conditions.push(eq(blogs.authorId, query.authorId));
	}

	if (query.isPublished !== undefined) {
		conditions.push(eq(blogs.isPublished, query.isPublished));
	}

	if (query.title?.$regex) {
		conditions.push(ilike(blogs.title, `%${query.title.$regex}%`));
	}

	let finalCondition = conditions.length > 0 ? and(...conditions) : undefined;

	if (finalCondition) {
		dbQuery = dbQuery.where(finalCondition);
		countQuery = countQuery.where(finalCondition);
	}

	const [blogsData, totalResult] = await Promise.all([
		dbQuery.orderBy(desc(blogs.createdAt)).offset(skip).limit(limit),
		countQuery,
	]);

	return [blogsData, Number(totalResult[0]?.count || 0)] as [any[], number];
}


const _getCachedAdminBlogsList = unstable_cache(
	async (
		query: BlogQuery,
		skip: number,
		limit: number,
		userId?: string,
		role?: string,
		permissions?: any
	) => fetchBlogsList(query, skip, limit, userId, role, permissions),
	["admin-blogs-list"],
	{ revalidate: 86400, tags: ["blogs"] }
);

export const getCachedBlogs = async (
	query: BlogQuery,
	skip: number,
	limit: number,
	userId?: string,
	role?: string,
	permissions?: any
): Promise<[any[], number]> => {
	const isAdminLevel = role === "ADMIN";

	if (isAdminLevel) {
		return _getCachedAdminBlogsList(query, skip, limit, userId, role, permissions);
	} else {
		return fetchBlogsList(query, skip, limit, userId, role, permissions);
	}
};

export const getCachedAdminBlogDetails = getBlogByIdCached;


export const getCachedAdminBlogEdit = getBlogByIdCached;

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
			keywords: keywordsFromFormData(formData),
		};

		const parsed = blogSchema.safeParse(rawData);
		if (!parsed.success) {
			return { success: false, error: parsed.error.issues[0].message };
		}

		let {
			title,
			content,
			excerpt,
			coverImage,
			isPublished,
			metaTitle,
			metaDescription,
			keywords,
		} = parsed.data;

		const keywordsArr = keywords;

		const slug =
			slugify(title, { lower: true, strict: true }) +
			"-" +
			Date.now().toString().slice(-4);

		if (!session?.user?.id) return { success: false, error: "Unauthorized" };
		const userId = session.user.id;

		const insertResult = await db.insert(blogs).values({
			title,
			slug,
			content,
			excerpt,
			coverImage,
			isPublished,
			authorId: userId,
			metaTitle,
			metaDescription,
			keywords: keywordsArr,
		}).returning();

		const newBlog = insertResult[0];

		revalidatePath("/");
		revalidatePath("/admin/blogs");
		revalidateTag("blogs", "max");

		if (isPublished) {
			await pingIndexNow(slug);
		}

		try {
			await db.insert(notifications).values({
				message: `New blog created: "${title}"`,
				link: `/admin/blogs/${newBlog.id}`,
				blogLink: `/admin/blogs/${newBlog.id}`,
				type: "BLOG_PUBLISHED",
				userId: userId,
				targetAuthorId: userId
			});
		} catch (err) {
			console.error("Failed to create notification for new blog:", err);
		}

		return { success: true, data: { ...newBlog, _id: newBlog.id } };
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

		const blogResult = await db.select().from(blogs).where(eq(blogs.id, id));
		const blog = blogResult[0];

		if (!blog) return { success: false, error: "Blog not found" };

		const isOwner = blog.authorId === session.user.id;
		const canManageOtherBlogs = session.user.role === "ADMIN";

		if (!isOwner && !canManageOtherBlogs) {
			return {
				success: false,
				error: "Forbidden: You don't have permission to delete this blog",
			};
		}

		if (blog.coverImage) {
			await UploadService.delete(blog.coverImage);
		}

		const slugToPing = blog.slug;

		await db.delete(blogs).where(eq(blogs.id, id));
		await db.delete(comments).where(eq(comments.blogId, id));

		if (!isOwner) {
			try {
				await db.insert(notifications).values({
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
		revalidateTag("blogs", "max");

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
			keywords: keywordsFromFormData(formData),
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

		// Admin routes may pass either DB id (UUID) or slug (table view used slug in URL).
		const byId = await db.select().from(blogs).where(eq(blogs.id, id)).limit(1);
		const blog =
			byId[0] ??
			(
				await db
					.select()
					.from(blogs)
					.where(eq(blogs.slug, id))
					.limit(1)
			)[0];
		if (!blog) return { success: false, error: "Blog not found" };

		const blogId = blog.id;

		const isOwner = blog.authorId === session.user.id;
		const canManageOtherBlogs = session.user.role === "ADMIN";

		if (!isOwner && !canManageOtherBlogs) {
			return {
				success: false,
				error: "Forbidden: You don't have permission to edit this blog",
			};
		}

		if (oldCoverImage && oldCoverImage !== coverImage) {
			await UploadService.delete(oldCoverImage);
		}

		const newSlug =
			slugify(title, { lower: true, strict: true }) +
			"-" +
			blogId.slice(-4);

		const keywordsArr = keywords;

		const updateResult = await db.update(blogs).set({
			title,
			slug: newSlug,
			content,
			excerpt,
			coverImage,
			isPublished,
			metaTitle,
			metaDescription,
			keywords: keywordsArr,
			updatedAt: new Date(),
		}).where(eq(blogs.id, blogId)).returning();

		const updatedBlog = updateResult[0];

		if (!isOwner) {
			try {
				let notifType: any = "BLOG_UPDATE";
				let msg = `Your blog "${title}" was updated by an administrator.`;

				if (blog.isPublished !== isPublished) {
					notifType = isPublished ? "BLOG_PUBLISHED" : "BLOG_UNPUBLISHED";
					msg = `Your blog "${title}" was ${isPublished ? "published" : "unpublished"} by an administrator.`;
				}

				await db.insert(notifications).values({
					message: msg,
					link: `/admin/blogs`,
					blogLink: `/admin/blogs/${blogId}`,
					type: notifType,
					userId: session.user.id,
					targetAuthorId: blog.authorId
				});
			} catch (err) {
				console.error("Failed to notify author of update:", err);
			}
		}

		revalidatePath("/");
		revalidatePath(`/blogs/${newSlug}`);
		revalidatePath("/admin/blogs");
		revalidateTag("blogs", "max");

		if (isPublished) {
			await pingIndexNow(newSlug);
		}

		return { success: true, data: { ...updatedBlog, _id: updatedBlog.id } };
	} catch (error: any) {
		console.error("[updateBlog] Error:", error);
		return {
			success: false,
			error: error.message || "An unexpected error occurred",
		};
	}
}
