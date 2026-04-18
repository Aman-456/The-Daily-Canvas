import { db } from "@/db/index";
import { articleVotes, commentVotes } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const ARTICLE_VOTES_TAG = "article-votes";

const ARTICLE_VOTE_CACHE_TTL = 3600;

/**
 * Public article score (sum of all votes).
 *
 * Cached across requests and invalidated via `revalidateTag(ARTICLE_VOTES_TAG)`
 * from `toggleArticleVote`, so changes propagate within one request after a vote.
 */
const _getArticleScoreCached = unstable_cache(
	async (blogId: string): Promise<number> => {
		const [row] = await db
			.select({ score: sql<number>`coalesce(sum(${articleVotes.value}), 0)` })
			.from(articleVotes)
			.where(eq(articleVotes.blogId, blogId));
		return Number(row?.score ?? 0);
	},
	["article-vote-score-v1"],
	{ revalidate: ARTICLE_VOTE_CACHE_TTL, tags: [ARTICLE_VOTES_TAG] },
);

export const getArticleScoreCached = (blogId: string) =>
	_getArticleScoreCached(blogId);

/**
 * Per-user vote value. Not cached — depends on the viewer's session.
 * Returns 1 | -1 | 0.
 */
export async function getMyArticleVoteValue(
	blogId: string,
	userId: string,
): Promise<1 | -1 | 0> {
	const [row] = await db
		.select({ value: articleVotes.value })
		.from(articleVotes)
		.where(and(eq(articleVotes.blogId, blogId), eq(articleVotes.userId, userId)))
		.limit(1);
	return (row?.value === 1 ? 1 : row?.value === -1 ? -1 : 0) as 1 | -1 | 0;
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
