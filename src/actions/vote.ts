"use server";

import { auth } from "@/auth";
import { db } from "@/db/index";
import { articleVotes, commentVotes, comments, blogs } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

function normalizeVoteValue(value: number): 1 | -1 | null {
	if (value === 1) return 1;
	if (value === -1) return -1;
	return null;
}

async function getArticleScore(blogId: string): Promise<number> {
	const [row] = await db
		.select({ score: sql<number>`coalesce(sum(${articleVotes.value}), 0)` })
		.from(articleVotes)
		.where(eq(articleVotes.blogId, blogId));
	return Number(row?.score ?? 0);
}

async function getCommentScore(commentId: string): Promise<number> {
	const [row] = await db
		.select({ score: sql<number>`coalesce(sum(${commentVotes.value}), 0)` })
		.from(commentVotes)
		.where(eq(commentVotes.commentId, commentId));
	return Number(row?.score ?? 0);
}

export async function toggleArticleVote(params: {
	blogId: string;
	value: number;
	slug?: string;
}) {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Unauthorized" };

		const [blogRow] = await db
			.select({ authorId: blogs.authorId })
			.from(blogs)
			.where(eq(blogs.id, params.blogId))
			.limit(1);
		if (!blogRow) return { success: false, error: "Article not found" };
		if (blogRow.authorId === session.user.id) {
			return { success: false, error: "You cannot vote on your own article" };
		}

		const normalized = normalizeVoteValue(params.value);
		if (!normalized) return { success: false, error: "Invalid vote value" };

		const existing = await db
			.select({ id: articleVotes.id, value: articleVotes.value })
			.from(articleVotes)
			.where(
				and(
					eq(articleVotes.blogId, params.blogId),
					eq(articleVotes.userId, session.user.id),
				),
			)
			.limit(1);

		let myVote: 1 | -1 | 0 = 0;
		if (existing[0]) {
			if (existing[0].value === normalized) {
				await db.delete(articleVotes).where(eq(articleVotes.id, existing[0].id));
				myVote = 0;
			} else {
				await db
					.update(articleVotes)
					.set({ value: normalized, updatedAt: new Date() })
					.where(eq(articleVotes.id, existing[0].id));
				myVote = normalized;
			}
		} else {
			await db.insert(articleVotes).values({
				blogId: params.blogId,
				userId: session.user.id,
				value: normalized,
			});
			myVote = normalized;
		}

		const score = await getArticleScore(params.blogId);

		if (params.slug) {
			revalidatePath(`/articles/${params.slug}`);
		}
		revalidateTag("blogs", "max");

		return { success: true, data: { score, myVote } };
	} catch (error: any) {
		console.error("[toggleArticleVote] Error:", error);
		return { success: false, error: error.message || "An unexpected error occurred" };
	}
}

export async function toggleCommentVote(params: {
	commentId: string;
	value: number;
	slug?: string;
}) {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Unauthorized" };

		const [commentRow] = await db
			.select({ userId: comments.userId })
			.from(comments)
			.where(eq(comments.id, params.commentId))
			.limit(1);
		if (!commentRow) return { success: false, error: "Comment not found" };
		if (commentRow.userId === session.user.id) {
			return { success: false, error: "You cannot vote on your own comment" };
		}

		const normalized = normalizeVoteValue(params.value);
		if (!normalized) return { success: false, error: "Invalid vote value" };

		const existing = await db
			.select({ id: commentVotes.id, value: commentVotes.value })
			.from(commentVotes)
			.where(
				and(
					eq(commentVotes.commentId, params.commentId),
					eq(commentVotes.userId, session.user.id),
				),
			)
			.limit(1);

		let myVote: 1 | -1 | 0 = 0;
		if (existing[0]) {
			if (existing[0].value === normalized) {
				await db.delete(commentVotes).where(eq(commentVotes.id, existing[0].id));
				myVote = 0;
			} else {
				await db
					.update(commentVotes)
					.set({ value: normalized, updatedAt: new Date() })
					.where(eq(commentVotes.id, existing[0].id));
				myVote = normalized;
			}
		} else {
			await db.insert(commentVotes).values({
				commentId: params.commentId,
				userId: session.user.id,
				value: normalized,
			});
			myVote = normalized;
		}

		const score = await getCommentScore(params.commentId);

		if (params.slug) {
			revalidatePath(`/articles/${params.slug}`);
		}
		revalidateTag("comments", "max");

		return { success: true, data: { score, myVote } };
	} catch (error: any) {
		console.error("[toggleCommentVote] Error:", error);
		return { success: false, error: error.message || "An unexpected error occurred" };
	}
}

export async function getMyArticleVote(blogId: string) {
	const session = await auth();
	if (!session?.user?.id) return { success: true, data: { myVote: 0 as 0 } };
	const [row] = await db
		.select({ value: articleVotes.value })
		.from(articleVotes)
		.where(and(eq(articleVotes.blogId, blogId), eq(articleVotes.userId, session.user.id)))
		.limit(1);
	return {
		success: true,
		data: { myVote: (row?.value === 1 ? 1 : row?.value === -1 ? -1 : 0) as 1 | -1 | 0 },
	};
}

export async function getMyCommentVote(commentId: string) {
	const session = await auth();
	if (!session?.user?.id) return { success: true, data: { myVote: 0 as 0 } };
	const [row] = await db
		.select({ value: commentVotes.value })
		.from(commentVotes)
		.where(and(eq(commentVotes.commentId, commentId), eq(commentVotes.userId, session.user.id)))
		.limit(1);
	return {
		success: true,
		data: { myVote: (row?.value === 1 ? 1 : row?.value === -1 ? -1 : 0) as 1 | -1 | 0 },
	};
}

