"use server";

import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Comment from "@/models/Comment";
import Blog from "@/models/Blog";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";

import { isAdminOrSubAdmin } from "@/lib/utils";
import { commentSchema } from "@/lib/validations/comment";
import { getBlogComments, getCommentReplies } from "@/queries/comment";

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

		await dbConnect();

		// Ensure parentId is a valid ObjectId string or null
		let parentId = null;
		if (parentIdRaw && mongoose.isValidObjectId(parentIdRaw)) {
			parentId = parentIdRaw;
		}

		const newComment = await Comment.create({
			content,
			blogId,
			userId: session.user.id,
			parentId,
		});

		// Populate for the client to show name/image immediately
		const populated = await newComment.populate("userId", "name image");

		console.log("[addComment] Saved:", populated);

		// Update blog aggregate count and await it for reliability
		await updateBlogCommentCount(blogId);

		// revalidatePath is more reliable in this version
		if (slug) revalidatePath(`/blogs/${slug}`);
		revalidatePath("/");
		revalidateTag("blogs", "max");

		return { success: true, data: JSON.parse(JSON.stringify(populated)) };
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
		console.log("[updateBlogCommentCount] Received:", { blogId });
		await dbConnect();
		const count = await Comment.countDocuments({ blogId, isApproved: true });
		console.log("[updateBlogCommentCount] Count:", count);
		await Blog.findByIdAndUpdate(blogId, { commentsCount: count });
		console.log("[updateBlogCommentCount] Updated:", { blogId, count });
	} catch (error) {
		console.error(`[updateBlogCommentCount] Failed for blog ${blogId}:`, error);
	}
}
export async function toggleCommentApproval(commentId: string) {
	try {
		const session = await auth();
		if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUBADMIN") {
			return { success: false, error: "Unauthorized" };
		}

		await dbConnect();
		const comment = await Comment.findById(commentId);
		if (!comment) return { success: false, error: "Comment not found" };

		comment.isApproved = !comment.isApproved;
		await comment.save();

		// Update blog aggregate count and await it
		await updateBlogCommentCount(comment.blogId.toString());

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

		await dbConnect();
		const comment = await Comment.findById(commentId);
		if (!comment) return { success: false, error: "Comment not found" };

		if (comment.userId.toString() !== session.user.id) {
			return {
				success: false,
				error: "Unauthorized: You can only edit your own comments",
			};
		}

		comment.content = parsed.data.content;
		comment.isEdited = true;
		await comment.save();

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

		await dbConnect();
		const comment = await Comment.findById(commentId);
		if (!comment) return { success: false, error: "Comment not found" };

		const isAdmin = isAdminOrSubAdmin(session.user.role);
		const isOwner = comment.userId.toString() === session.user.id;

		if (!isAdmin && !isOwner) {
			return {
				success: false,
				error: "Unauthorized: You can only delete your own comments",
			};
		}

		const replyCount = await Comment.countDocuments({
			parentId: commentId,
		});

		if (replyCount > 0) {
			comment.content = "[deleted]";
			comment.isDeleted = true;
			comment.userId = "000000000000000000000000"; // Dummy deleted user ID or simply null
			await comment.save();
		} else {
			await Comment.findByIdAndDelete(commentId);
		}

		if (slug) revalidatePath(`/blogs/${slug}`);
		revalidatePath("/");
		revalidateTag("blogs", "max");

		// Update blog aggregate count and await it
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
		if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUBADMIN") {
			return { success: false, error: "Unauthorized" };
		}

		await dbConnect();
		await Comment.deleteMany({ blogId });

		// Update blog aggregate count and await it
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
