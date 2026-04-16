"use server";

import { getRelatedBlogs } from "@/queries/blog";

export async function getRelatedBlogsAction(params: {
	blogId: string;
	tags: string[];
	limit?: number;
}) {
	try {
		const limit =
			typeof params.limit === "number" && Number.isFinite(params.limit)
				? Math.max(1, Math.min(12, Math.floor(params.limit)))
				: 4;
		const tags = [...new Set((params.tags ?? []).filter(Boolean))];
		const posts = await getRelatedBlogs(params.blogId, tags, limit);
		return { success: true as const, data: { posts } };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		return { success: false as const, error: message };
	}
}

