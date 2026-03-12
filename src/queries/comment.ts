import dbConnect from "@/lib/mongoose";
import Comment from "@/models/Comment";
import { unstable_cache } from "next/cache";

export async function getBlogComments(
	blogId: string,
	page = 1,
	limit = 10,
	lastTimestamp?: string,
) {
	await dbConnect();

	const query: any = {
		blogId,
		parentId: null,
		isApproved: true,
	};

	if (lastTimestamp) {
		query.createdAt = { $lt: new Date(lastTimestamp) };
	}

	const skip = lastTimestamp ? 0 : (page - 1) * limit;

	// Fetch root comments (limit + 1 to check hasMore)
	const rootComments = await Comment.find(query)
		.populate("userId", "name image")
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(limit + 1)
		.lean();

	const hasMore = rootComments.length > limit;
	const results = hasMore ? rootComments.slice(0, limit) : rootComments;

	const totalRoots = await Comment.countDocuments({
		blogId,
		parentId: null,
		isApproved: true,
	});

	// Get reply counts for these root comments
	const rootIds = results.map((c) => c._id);
	const replyCounts = await Comment.aggregate([
		{
			$match: {
				parentId: { $in: rootIds },
				isApproved: true,
			},
		},
		{
			$group: {
				_id: "$parentId",
				count: { $sum: 1 },
			},
		},
	]);

	const replyCountMap = new Map(
		replyCounts.map((rc) => [rc._id.toString(), rc.count]),
	);

	// Root comments don't fetch replies here anymore
	// Transition flat list to nested tree structure (now just roots)
	const roots = JSON.parse(JSON.stringify(results)).map((c: any) => ({
		...c,
		replies: [],
		replyCount: replyCountMap.get(c._id.toString()) || 0,
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
) {
	await dbConnect();

	const query: any = {
		parentId,
		isApproved: true,
	};

	if (lastTimestamp) {
		query.createdAt = { $gt: new Date(lastTimestamp) };
	}

	const skip = lastTimestamp ? 0 : (page - 1) * limit;

	const total = await Comment.countDocuments({
		parentId,
		isApproved: true,
	});

	const replies = await Comment.find(query)
		.populate("userId", "name image")
		.sort({ createdAt: 1 })
		.skip(skip)
		.limit(limit + 1)
		.lean();

	const hasMore = replies.length > limit;
	const results = hasMore ? replies.slice(0, limit) : replies;

	// Fetch reply counts for these replies
	const replyIds = results.map((c: any) => c._id);
	const subReplyCounts = await Comment.aggregate([
		{
			$match: {
				parentId: { $in: replyIds },
				isApproved: true,
			},
		},
		{
			$group: {
				_id: "$parentId",
				count: { $sum: 1 },
			},
		},
	]);

	const subReplyCountMap = new Map(
		subReplyCounts.map((rc) => [rc._id.toString(), rc.count]),
	);

	const populatedReplies = JSON.parse(JSON.stringify(results)).map(
		(c: any) => ({
			...c,
			replies: [],
			replyCount: subReplyCountMap.get(c._id.toString()) || 0,
		}),
	);

	return {
		replies: populatedReplies,
		total,
		hasMore,
	};
}
export async function getAllComments(page = 1, limit = 20, search?: string) {
	await dbConnect();

	let query = {};
	if (search) {
		const isObjectId = /^[0-9a-fA-F]{24}$/.test(search);
		if (isObjectId) {
			query = { blogId: search };
		} else {
			query = { content: { $regex: search, $options: "i" } };
		}
	}

	const total = await Comment.countDocuments(query);
	const comments = await Comment.find(query)
		.populate("userId", "name email")
		.populate("blogId", "title slug")
		.sort({ createdAt: -1 })
		.skip((page - 1) * limit)
		.limit(limit)
		.lean();

	return {
		comments: JSON.parse(JSON.stringify(comments)),
		total,
		totalPages: Math.ceil(total / limit),
	};
}

export const getLatestRootComment = async (blogId: string) => {
	const fetchWithCache = unstable_cache(
		async () => {
			await dbConnect();
			const comment = await Comment.findOne({
				blogId,
				parentId: null,
				isApproved: true,
			})
				.populate("userId", "name image")
				.sort({ createdAt: -1 })
				.lean();

			return comment ? JSON.parse(JSON.stringify(comment)) : null;
		},
		["latest-comment", blogId],
		{ revalidate: 3600, tags: ["blogs"] },
	);

	return fetchWithCache();
};
