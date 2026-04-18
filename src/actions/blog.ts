"use server";

import { db } from "@/db/index";
import { blogs, users, notifications } from "@/db/schema";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { revalidatePath, revalidateTag } from "next/cache";
import slugify from "slugify";
import { unstable_cache } from "next/cache";
import { eq, desc, asc, and, sql, ilike } from "drizzle-orm";
import { blogFullSelector } from "@/db/selectors";
import { getBlogByIdCached } from "@/queries/blog";
import {
	blogSchema,
	keywordsFromFormData,
	tagsFromFormData,
} from "@/lib/validations/blog";
import { UploadService } from "@/lib/upload";
import { pingIndexNow } from "@/lib/indexnow";
import type { UserPermissions } from "@/lib/constants";

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
	permissions?: UserPermissions | null,
	sort: "created_desc" | "created_asc" | "views_desc" | "comments_desc" = "created_desc",
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

	const orderBy =
		sort === "created_asc"
			? asc(blogs.createdAt)
			: sort === "views_desc"
				? desc(blogs.viewCount)
				: sort === "comments_desc"
					? desc(blogs.commentsCount)
					: desc(blogs.createdAt);

	const [blogsData, totalResult] = await Promise.all([
		dbQuery.orderBy(orderBy).offset(skip).limit(limit),
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
		permissions?: UserPermissions | null,
		sort?: "created_desc" | "created_asc" | "views_desc" | "comments_desc",
	) => fetchBlogsList(query, skip, limit, userId, role, permissions, sort),
	["admin-blogs-list"],
	{ revalidate: 86400, tags: ["blogs"] }
);

export const getCachedBlogs = async (
	query: BlogQuery,
	skip: number,
	limit: number,
	userId?: string,
	role?: string,
	permissions?: UserPermissions | null,
	sort?: "created_desc" | "created_asc" | "views_desc" | "comments_desc",
): Promise<[any[], number]> => {
	const isAdminLevel = role === "ADMIN";

	if (isAdminLevel) {
		return _getCachedAdminBlogsList(query, skip, limit, userId, role, permissions, sort);
	} else {
		return fetchBlogsList(query, skip, limit, userId, role, permissions, sort);
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
			tags: tagsFromFormData(formData),
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
			tags,
		} = parsed.data;

		const keywordsArr = keywords;
		const tagsArr = tags;

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
			tags: tagsArr,
		}).returning();

		const newBlog = insertResult[0];

		revalidatePath("/");
		revalidatePath("/admin/blogs");
		revalidateTag("blogs", "max");
		revalidateTag("stats", "max");

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

		const slugToPing = blog.slug;
		const coverImageToDelete = blog.coverImage;

		// DB writes run in a transaction so we never end up with a half-deleted
		// blog (e.g. blog row gone, notification missing). Comments and votes
		// cascade-delete via their FKs (see src/db/schema.ts).
		await db.transaction(async (tx) => {
			await tx.delete(blogs).where(eq(blogs.id, id));

			if (!isOwner) {
				await tx.insert(notifications).values({
					message: `Your blog "${blog.title}" was deleted by an administrator.`,
					link: "/admin/blogs",
					blogLink: "/admin/blogs",
					type: "BLOG_DELETE",
					userId: session.user!.id!,
					targetAuthorId: blog.authorId
				});
			}
		});

		// Best-effort blob cleanup *after* the commit: a stray file is cheaper
		// than losing a successful delete to a blob outage.
		if (coverImageToDelete) {
			try {
				await UploadService.delete(coverImageToDelete);
			} catch (err) {
				console.error("[deleteBlog] Failed to delete cover image from blob:", err);
			}
		}

		revalidatePath("/");
		revalidatePath("/admin/blogs");
		revalidateTag("blogs", "max");
		revalidateTag("stats", "max");

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
			tags: tagsFromFormData(formData),
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
			tags,
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

		// Slug is frozen after creation so external links, RSS, sitemap, and
		// IndexNow history keep working even when the title is edited.
		const existingSlug = blog.slug;

		const keywordsArr = keywords;
		const tagsArr = tags;

		const updateResult = await db.update(blogs).set({
			title,
			content,
			excerpt,
			coverImage,
			isPublished,
			metaTitle,
			metaDescription,
			keywords: keywordsArr,
			tags: tagsArr,
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
		revalidatePath(`/articles/${existingSlug}`);
		revalidatePath("/admin/blogs");
		revalidateTag("blogs", "max");

		if (isPublished) {
			await pingIndexNow(existingSlug);
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

export async function saveDraft(blogId: string, formData: FormData) {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Unauthorized" };

		const blog = await db.query.blogs.findFirst({
			where: eq(blogs.id, blogId),
		});
		if (!blog) return { success: false, error: "Blog not found" };
		if (blog.authorId !== session.user.id && !isAdmin(session.user.role)) {
			return { success: false, error: "Unauthorized" };
		}

		const title = (formData.get("title") as string | null)?.trim() || blog.title;
		const content = (formData.get("content") as string | null) ?? blog.content;
		const excerpt = (formData.get("excerpt") as string | null) ?? blog.excerpt;
		const coverImage = (formData.get("coverImage") as string | null) ?? blog.coverImage;
		const metaTitle = (formData.get("metaTitle") as string | null) ?? blog.metaTitle;
		const metaDescription =
			(formData.get("metaDescription") as string | null) ?? blog.metaDescription;

		await db
			.update(blogs)
			.set({
				title,
				content,
				excerpt,
				coverImage,
				metaTitle,
				metaDescription,
				isPublished: false,
				updatedAt: new Date(),
			})
			.where(eq(blogs.id, blogId));

		revalidatePath(`/admin/blogs/${blogId}/edit`);
		revalidateTag("blogs", "max");

		return { success: true };
	} catch (error: any) {
		console.error("[saveDraft] Error:", error);
		return { success: false, error: error.message || "An unexpected error occurred" };
	}
}
