import { db } from "@/db/index";
import { comments, users, blogs, commentVotes } from "@/db/schema";
import { unstable_cache } from "next/cache";
import { eq, and, desc, asc, isNull, inArray, sql, like } from "drizzle-orm";

export async function getBlogComments(
	blogId: string,
	page = 1,
	limit = 10,
	lastTimestamp?: string,
	viewerUserId?: string,
) {
	const skip = lastTimestamp ? 0 : (page - 1) * limit;

	let rootConditions = [
		eq(comments.blogId, blogId),
		isNull(comments.parentId),
		eq(comments.isApproved, true),
		eq(comments.isHidden, false)
	];

	if (lastTimestamp) {
		rootConditions.push(sql`${comments.createdAt} < ${new Date(lastTimestamp)}`);
	}

	const viewerVoteSql = viewerUserId
		? sql<number>`(select ${commentVotes.value} from ${commentVotes} where ${commentVotes.commentId} = ${comments.id} and ${commentVotes.userId} = ${viewerUserId} limit 1)`
		: sql<number>`null`;

	const rootQuery = db.select({
			id: comments.id,
			content: comments.content,
			blogId: comments.blogId,
			parentId: comments.parentId,
			isApproved: comments.isApproved,
			isEdited: comments.isEdited,
			isDeleted: comments.isDeleted,
			isHidden: comments.isHidden,
			createdAt: comments.createdAt,
			updatedAt: comments.updatedAt,
			_id: comments.id,
			voteScore: sql<number>`(select coalesce(sum(${commentVotes.value}), 0) from ${commentVotes} where ${commentVotes.commentId} = ${comments.id})`,
			myVote: viewerVoteSql,
			userId: {
				_id: users.id,
				name: users.name,
				image: users.image
			}
		})
		.from(comments)
		.leftJoin(users, eq(comments.userId, users.id))
		.where(and(...rootConditions))
		.orderBy(desc(comments.createdAt))
		.limit(limit + 1)
		.offset(skip);

	const rootComments = await rootQuery;

	const hasMore = rootComments.length > limit;
	const results = hasMore ? rootComments.slice(0, limit) : rootComments;

	const totalResult = await db.select({ count: sql<number>`count(*)` })
		.from(comments)
		.where(and(eq(comments.blogId, blogId), isNull(comments.parentId), eq(comments.isApproved, true), eq(comments.isHidden, false)));

	const totalRoots = totalResult[0].count;

	const rootIds = results.map((c: any) => c._id);
	let replyCountMap = new Map<string, number>();

	if (rootIds.length > 0) {
		const replyCounts = await db.select({
				parentId: comments.parentId,
				count: sql<number>`count(*)`
			})
			.from(comments)
			.where(and(inArray(comments.parentId, rootIds as string[]), eq(comments.isApproved, true)))
			.groupBy(comments.parentId);

		for (const rc of replyCounts) {
			if (rc.parentId) replyCountMap.set(rc.parentId, Number(rc.count));
		}
	}

	const roots = results.map((c: any) => ({
		...c,
		replies: [],
		replyCount: replyCountMap.get(c._id) || 0,
	}));

	return {
		comments: roots,
		total: totalRoots,
		hasMore,
	};
}

export async function getCommentReplies(
	parentId: string,
	page = 1,
	limit = 10,
	lastTimestamp?: string,
	viewerUserId?: string,
) {
	const skip = lastTimestamp ? 0 : (page - 1) * limit;

	let replyConditions = [
		eq(comments.parentId, parentId),
		eq(comments.isApproved, true),
		eq(comments.isHidden, false)
	];

	if (lastTimestamp) {
		replyConditions.push(sql`${comments.createdAt} > ${new Date(lastTimestamp)}`);
	}

	const totalResult = await db.select({ count: sql<number>`count(*)` })
		.from(comments)
		.where(and(eq(comments.parentId, parentId), eq(comments.isApproved, true), eq(comments.isHidden, false)));

	const total = totalResult[0].count;

	const viewerVoteSql = viewerUserId
		? sql<number>`(select ${commentVotes.value} from ${commentVotes} where ${commentVotes.commentId} = ${comments.id} and ${commentVotes.userId} = ${viewerUserId} limit 1)`
		: sql<number>`null`;

	const fetchedReplies = await db.select({
			id: comments.id,
			content: comments.content,
			blogId: comments.blogId,
			parentId: comments.parentId,
			isApproved: comments.isApproved,
			isEdited: comments.isEdited,
			isDeleted: comments.isDeleted,
			isHidden: comments.isHidden,
			createdAt: comments.createdAt,
			updatedAt: comments.updatedAt,
			_id: comments.id,
			voteScore: sql<number>`(select coalesce(sum(${commentVotes.value}), 0) from ${commentVotes} where ${commentVotes.commentId} = ${comments.id})`,
			myVote: viewerVoteSql,
			userId: {
				_id: users.id,
				name: users.name,
				image: users.image
			}
		})
		.from(comments)
		.leftJoin(users, eq(comments.userId, users.id))
		.where(and(...replyConditions))
		.orderBy(asc(comments.createdAt))
		.limit(limit + 1)
		.offset(skip);

	const hasMore = fetchedReplies.length > limit;
	const results = hasMore ? fetchedReplies.slice(0, limit) : fetchedReplies;

	const replyIds = results.map((c: any) => c._id);
	let subReplyCountMap = new Map<string, number>();

	if (replyIds.length > 0) {
		const subReplyCounts = await db.select({
				parentId: comments.parentId,
				count: sql<number>`count(*)`
			})
			.from(comments)
			.where(and(inArray(comments.parentId, replyIds as string[]), eq(comments.isApproved, true)))
			.groupBy(comments.parentId);

		for (const rc of subReplyCounts) {
			if (rc.parentId) subReplyCountMap.set(rc.parentId, Number(rc.count));
		}
	}

	const populatedReplies = results.map(
		(c: any) => ({
			...c,
			replies: [],
			replyCount: subReplyCountMap.get(c._id) || 0,
		}),
	);

	return {
		replies: populatedReplies,
		total,
		hasMore,
	};
}

export async function getAllComments(
	page = 1,
	limit = 20,
	search?: string,
	userId?: string,
	role?: string,
	permissions?: any,
	filters?: { status?: string; sort?: string },
) {
	let queryConditions: any[] = [];

	if (search) {
		const isObjectId = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(search) || /^[0-9a-fA-F]{24}$/.test(search);
		if (isObjectId) {
			queryConditions.push(eq(comments.blogId, search));
		} else {
			queryConditions.push(like(comments.content, `%${search}%`));
		}
	}

	if (role === "USER" && userId) {
		const userBlogs = await db.select({ id: blogs.id }).from(blogs).where(eq(blogs.authorId, userId));
		const userBlogIds = userBlogs.map(b => b.id);
		if (userBlogIds.length > 0) {
			queryConditions.push(inArray(comments.blogId, userBlogIds));
		} else {
			return { comments: [], total: 0, totalPages: 0 };
		}
	}

	if (filters?.status === "approved") queryConditions.push(eq(comments.isApproved, true));
	if (filters?.status === "pending") queryConditions.push(eq(comments.isApproved, false));
	const finalCondition = queryConditions.length > 0 ? and(...queryConditions) : undefined;

	let countQuery = db.select({ count: sql<number>`count(*)` }).from(comments);
	if (finalCondition) { countQuery = countQuery.where(finalCondition) as any; }
	const totalResult = await countQuery;
	const total = totalResult[0].count;

	let dbQuery = db.select({
			id: comments.id,
			content: comments.content,
			parentId: comments.parentId,
			isApproved: comments.isApproved,
			isEdited: comments.isEdited,
			isDeleted: comments.isDeleted,
			createdAt: comments.createdAt,
			updatedAt: comments.updatedAt,
			_id: comments.id,
			userId: {
				_id: users.id,
				name: users.name,
				email: users.email
			},
			blogId: {
				_id: blogs.id,
				title: blogs.title,
				slug: blogs.slug
			}
		})
		.from(comments)
		.leftJoin(users, eq(comments.userId, users.id))
		.leftJoin(blogs, eq(comments.blogId, blogs.id))
		.orderBy(filters?.sort === "created_asc" ? asc(comments.createdAt) : desc(comments.createdAt))
		.offset((page - 1) * limit)
		.limit(limit);

	if (finalCondition) { dbQuery = dbQuery.where(finalCondition) as any; }

	const fetchedComments = await dbQuery;

	return {
		comments: fetchedComments,
		total,
		totalPages: Math.ceil(total / limit),
	};
}

/** Single approved comment on a blog, with direct-child count (for permalink thread view). */
export async function getApprovedCommentForPublicThread(
	blogId: string,
	commentId: string,
) {
	const row = await db
		.select({
			id: comments.id,
			content: comments.content,
			blogId: comments.blogId,
			parentId: comments.parentId,
			isApproved: comments.isApproved,
			isEdited: comments.isEdited,
			isDeleted: comments.isDeleted,
			createdAt: comments.createdAt,
			updatedAt: comments.updatedAt,
			_id: comments.id,
			userId: {
				_id: users.id,
				name: users.name,
				image: users.image,
			},
		})
		.from(comments)
		.leftJoin(users, eq(comments.userId, users.id))
		.where(
			and(
				eq(comments.id, commentId),
				eq(comments.blogId, blogId),
				eq(comments.isApproved, true),
			),
		)
		.limit(1);

	const c = row[0];
	if (!c) return null;

	const [countRow] = await db
		.select({ count: sql<number>`count(*)` })
		.from(comments)
		.where(
			and(eq(comments.parentId, commentId), eq(comments.isApproved, true)),
		);

	const replyCount = Number(countRow?.count ?? 0);

	return {
		...c,
		replies: [] as unknown[],
		replyCount,
	};
}

export const getLatestRootComment = async (blogId: string) => {
	const fetchWithCache = unstable_cache(
		async () => {
			const fetched = await db.select({
				id: comments.id,
				content: comments.content,
				blogId: comments.blogId,
				parentId: comments.parentId,
				isApproved: comments.isApproved,
				isEdited: comments.isEdited,
				isDeleted: comments.isDeleted,
				createdAt: comments.createdAt,
				updatedAt: comments.updatedAt,
				_id: comments.id,
				userId: {
					_id: users.id,
					name: users.name,
					image: users.image
				}
			})
			.from(comments)
			.leftJoin(users, eq(comments.userId, users.id))
			.where(and(eq(comments.blogId, blogId), isNull(comments.parentId), eq(comments.isApproved, true)))
			.orderBy(desc(comments.createdAt))
			.limit(1);

			return fetched[0] || null;
		},
		["latest-comment", blogId],
		{ revalidate: 3600, tags: ["blogs"] },
	);

	return fetchWithCache();
};
