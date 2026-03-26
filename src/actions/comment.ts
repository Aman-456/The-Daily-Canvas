"use server";

import { db } from "@/db/index";
import { comments, blogs, notifications, users } from "@/db/schema";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { auth } from "@/auth";

import { isAdmin } from "@/lib/utils";
import { commentSchema } from "@/lib/validations/comment";
import { getBlogComments, getCommentReplies, getAllComments } from "@/queries/comment";
import { eq, sql } from "drizzle-orm";

const getCachedCommentsList = unstable_cache(
	getAllComments,
	["admin-comments-list"],
	{ revalidate: 86400, tags: ["comments"] }
);

export const getCachedComments = async (page: number, limit: number, search: string, userId?: string, role?: string, permissions?: any) => {
	const isAdminLevel = role === "ADMIN";

	if (isAdminLevel) {
		return getCachedCommentsList(page, limit, search, userId, role, permissions);
	} else {
		return getAllComments(page, limit, search, userId, role, permissions);
	}
};

export async function addComment(formData: FormData) {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, error: "You must be logged in to comment" };
		}

		const rawData = {
			content: formData.get("content"),
			blogId: formData.get("blogId"),
			slug: formData.get("slug"),
			parentId: formData.get("parentId"),
		};

		const parsed = commentSchema.safeParse(rawData);
		if (!parsed.success) {
			return { success: false, error: parsed.error.issues[0].message };
		}

		const { content, blogId, slug, parentId: parentIdRaw } = parsed.data;

		let parentId = parentIdRaw || null;

		if (!session?.user?.id) {
			return { success: false, error: "User ID not found" };
		}
		const userId = session.user.id;

		const insertResult = await db.insert(comments).values({
			content,
			blogId,
			userId,
			parentId,
		}).returning();

		const newComment = insertResult[0];

		const populatedUserResult = await db.select({
			_id: users.id,
			name: users.name,
			image: users.image
		}).from(users).where(eq(users.id, session.user.id));
		
		const populated = { ...newComment, userId: populatedUserResult[0] };

		console.log("[addComment] Saved:", populated);

		await updateBlogCommentCount(blogId);

		try {
			const blogResult = await db.select({
				title: blogs.title,
				slug: blogs.slug,
				authorId: blogs.authorId,
				_id: blogs.id
			}).from(blogs).where(eq(blogs.id, blogId));
			
			const blog = blogResult[0];

			if (blog) {
				await db.insert(notifications).values({
					message: `New comment on "${blog.title}"`,
					link: `/admin/comments`,
					blogLink: `/admin/blogs/${blog._id}#comment-${newComment.id}`,
					type: "COMMENT",
					userId: session.user.id,
					targetAuthorId: blog.authorId
				});
			}
		} catch (notifErr) {
			console.error("[addComment] Failed to create notification:", notifErr);
		}

		if (slug) revalidatePath(`/blogs/${slug}`);
		revalidatePath("/");
		revalidateTag("blogs", "max");

		return { success: true, data: { ...populated, _id: populated.id } };
	} catch (error: any) {
		console.error("[addComment] Error:", error);
		return {
			success: false,
			error: error.message || "An unexpected error occurred",
		};
	}
}

async function updateBlogCommentCount(blogId: string) {
	try {
		const result = await db.select({ count: sql<number>`count(*)` }).from(comments).where(sql`${comments.blogId} = ${blogId} AND ${comments.isApproved} = true`);
		const count = result[0].count;
		await db.update(blogs).set({ commentsCount: count }).where(eq(blogs.id, blogId));
	} catch (error) {
		console.error(`[updateBlogCommentCount] Failed for blog ${blogId}:`, error);
	}
}

export async function toggleCommentApproval(commentId: string) {
	try {
		const session = await auth();
		if (session?.user?.role !== "ADMIN") {
			const commentResult = await db.select({
				id: comments.id,
				blogId: {
					authorId: blogs.authorId
				}
			}).from(comments).leftJoin(blogs, eq(comments.blogId, blogs.id)).where(eq(comments.id, commentId));
			
			const commentWithBlog = commentResult[0];

			if (
				!commentWithBlog ||
				!commentWithBlog.blogId ||
				commentWithBlog.blogId.authorId !== session?.user?.id
			) {
				return { success: false, error: "Unauthorized" };
			}
		}

		const commentResult = await db.select().from(comments).where(eq(comments.id, commentId));
		const comment = commentResult[0];
		
		if (!comment) return { success: false, error: "Comment not found" };

		await db.update(comments).set({ isApproved: !comment.isApproved }).where(eq(comments.id, commentId));

		await updateBlogCommentCount(comment.blogId);

		revalidatePath("/");
		revalidateTag("blogs", "max");
		return { success: true };
	} catch (error: any) {
		console.error("[toggleCommentApproval] Error:", error);
		return {
			success: false,
			error: error.message || "An unexpected error occurred",
		};
	}
}

export async function updateComment(
	commentId: string,
	content: string,
	slug?: string,
) {
	try {
		const session = await auth();
		if (!session?.user) {
			return {
				success: false,
				error: "You must be logged in to edit a comment",
			};
		}

		const parsed = commentSchema.pick({ content: true }).safeParse({ content });
		if (!parsed.success) {
			return { success: false, error: parsed.error.issues[0].message };
		}

		const commentResult = await db.select().from(comments).where(eq(comments.id, commentId));
		const comment = commentResult[0];
		if (!comment) return { success: false, error: "Comment not found" };

		if (comment.userId !== session.user.id) {
			return {
				success: false,
				error: "Unauthorized: You can only edit your own comments",
			};
		}

		await db.update(comments).set({ content: parsed.data.content, isEdited: true }).where(eq(comments.id, commentId));

		if (slug) revalidatePath(`/blogs/${slug}`);
		revalidatePath("/");
		revalidateTag("blogs", "max");

		return { success: true };
	} catch (error: any) {
		console.error("[updateComment] Error:", error);
		return {
			success: false,
			error: error.message || "An unexpected error occurred",
		};
	}
}

export async function deleteComment(
	commentId: string,
	blogId: string,
	slug?: string,
) {
	try {
		const session = await auth();
		if (!session?.user) {
			return {
				success: false,
				error: "You must be logged in to delete a comment",
			};
		}

		const commentResult = await db.select().from(comments).where(eq(comments.id, commentId));
		const comment = commentResult[0];
		if (!comment) return { success: false, error: "Comment not found" };

		const isAdminRole = isAdmin(session.user.role);
		const isOwner = comment.userId === session.user.id;

		if (!isAdminRole && !isOwner) {
			return {
				success: false,
				error: "Unauthorized: You can only delete your own comments",
			};
		}

		const replyCountResult = await db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.parentId, commentId));
		const replyCount = replyCountResult[0].count;

		if (replyCount > 0) {
			await db.update(comments).set({
				content: "[deleted]",
				isDeleted: true
			}).where(eq(comments.id, commentId));
		} else {
			await db.delete(comments).where(eq(comments.id, commentId));
		}

		if (slug) revalidatePath(`/blogs/${slug}`);
		revalidatePath("/");
		revalidateTag("blogs", "max");

		await updateBlogCommentCount(blogId);

		return { success: true };
	} catch (error: any) {
		console.error("[deleteComment] Error:", error);
		return {
			success: false,
			error: error.message || "An unexpected error occurred",
		};
	}
}

export async function deleteAllCommentsForBlog(blogId: string, slug?: string) {
	try {
		const session = await auth();
		if (session?.user?.role !== "ADMIN") {
			const blogResult = await db.select({ authorId: blogs.authorId }).from(blogs).where(eq(blogs.id, blogId));
			const blog = blogResult[0];
			if (!blog || blog.authorId !== session?.user?.id) {
				return { success: false, error: "Unauthorized" };
			}
		}

		await db.delete(comments).where(eq(comments.blogId, blogId));

		await updateBlogCommentCount(blogId);

		if (slug) revalidatePath(`/blogs/${slug}`);
		revalidatePath("/");
		revalidateTag("blogs", "max");

		return { success: true };
	} catch (error: any) {
		console.error("[deleteAllCommentsForBlog] Error:", error);
		return {
			success: false,
			error: error.message || "An unexpected error occurred",
		};
	}
}

export async function getComments(
	blogId: string,
	page = 1,
	limit = 10,
	lastTimestamp?: string,
) {
	try {
		const result = await getBlogComments(blogId, page, limit, lastTimestamp);
		return { success: true, data: result };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function getReplies(
	parentId: string,
	page = 1,
	limit = 5,
	lastTimestamp?: string,
) {
	try {
		const result = await getCommentReplies(
			parentId,
			page,
			limit,
			lastTimestamp,
		);
		return { success: true, data: result };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}
