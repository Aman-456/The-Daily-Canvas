import { db } from "@/db/index";
import { articleVotes, commentVotes } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function getArticleVoteSummary(blogId: string, userId?: string) {
	const [scoreRow, myRow] = await Promise.all([
		db
			.select({ score: sql<number>`coalesce(sum(${articleVotes.value}), 0)` })
			.from(articleVotes)
			.where(eq(articleVotes.blogId, blogId)),
		userId
			? db
					.select({ value: articleVotes.value })
					.from(articleVotes)
					.where(and(eq(articleVotes.blogId, blogId), eq(articleVotes.userId, userId)))
					.limit(1)
			: Promise.resolve([] as { value: number }[]),
	]);

	const score = Number(scoreRow[0]?.score ?? 0);
	const myVote = userId
		? ((myRow[0]?.value === 1 ? 1 : myRow[0]?.value === -1 ? -1 : 0) as
				| 1
				| -1
				| 0)
		: (0 as 0);

	return { score, myVote };
}

export async function getCommentVoteSummary(commentId: string, userId?: string) {
	const [scoreRow, myRow] = await Promise.all([
		db
			.select({ score: sql<number>`coalesce(sum(${commentVotes.value}), 0)` })
			.from(commentVotes)
			.where(eq(commentVotes.commentId, commentId)),
		userId
			? db
					.select({ value: commentVotes.value })
					.from(commentVotes)
					.where(
						and(
							eq(commentVotes.commentId, commentId),
							eq(commentVotes.userId, userId),
						),
					)
					.limit(1)
			: Promise.resolve([] as { value: number }[]),
	]);

	const score = Number(scoreRow[0]?.score ?? 0);
	const myVote = userId
		? ((myRow[0]?.value === 1 ? 1 : myRow[0]?.value === -1 ? -1 : 0) as
				| 1
				| -1
				| 0)
		: (0 as 0);

	return { score, myVote };
}

