import { db } from "@/db/index";
import {
	articleReports,
	commentReports,
	blogs,
	comments,
	users,
} from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export type ModerationQueueType = "articles" | "comments";

export async function getModerationQueue(params: {
	type: ModerationQueueType;
	status?: "open" | "resolved" | "all";
	page: number;
	limit: number;
}) {
	const safePage = Math.max(1, Number.isFinite(params.page) ? params.page : 1);
	const safeLimit = Math.min(50, Math.max(1, Number.isFinite(params.limit) ? params.limit : 20));
	const offset = (safePage - 1) * safeLimit;
	const status = params.status ?? "open";

	if (params.type === "articles") {
		const conditions = [];
		if (status !== "all") {
			conditions.push(eq(articleReports.status, status));
		}

		const whereClause = conditions.length ? and(...(conditions as any)) : undefined;

		const [totalRows, items] = await Promise.all([
			db
				.select({ count: sql<number>`count(distinct ${articleReports.blogId})` })
				.from(articleReports)
				.where(whereClause as any),
			db
				.select({
					blogId: articleReports.blogId,
					blogSlug: blogs.slug,
					blogTitle: blogs.title,
					isHidden: blogs.isHidden,
					openReports: sql<number>`count(*)::int`,
					lastReportedAt: sql<Date>`max(${articleReports.createdAt})`,
				})
				.from(articleReports)
				.leftJoin(blogs, eq(articleReports.blogId, blogs.id))
				.where(whereClause as any)
				.groupBy(articleReports.blogId, blogs.slug, blogs.title, blogs.isHidden)
				.orderBy(desc(sql`max(${articleReports.createdAt})`))
				.limit(safeLimit)
				.offset(offset),
		]);

		return {
			items,
			total: Number(totalRows[0]?.count ?? 0),
			page: safePage,
			limit: safeLimit,
			totalPages: Math.ceil(Number(totalRows[0]?.count ?? 0) / safeLimit),
		};
	}

	const conditions = [];
	if (status !== "all") {
		conditions.push(eq(commentReports.status, status));
	}
	const whereClause = conditions.length ? and(...(conditions as any)) : undefined;

	const [totalRows, items] = await Promise.all([
		db
			.select({ count: sql<number>`count(distinct ${commentReports.commentId})` })
			.from(commentReports)
			.where(whereClause as any),
		db
			.select({
				commentId: commentReports.commentId,
				commentPreview: comments.content,
				blogId: comments.blogId,
				blogSlug: blogs.slug,
				isHidden: comments.isHidden,
				openReports: sql<number>`count(*)::int`,
				lastReportedAt: sql<Date>`max(${commentReports.createdAt})`,
				authorName: users.name,
			})
			.from(commentReports)
			.leftJoin(comments, eq(commentReports.commentId, comments.id))
			.leftJoin(blogs, eq(comments.blogId, blogs.id))
			.leftJoin(users, eq(comments.userId, users.id))
			.where(whereClause as any)
			.groupBy(
				commentReports.commentId,
				comments.content,
				comments.blogId,
				blogs.slug,
				comments.isHidden,
				users.name,
			)
			.orderBy(desc(sql`max(${commentReports.createdAt})`))
			.limit(safeLimit)
			.offset(offset),
	]);

	return {
		items,
		total: Number(totalRows[0]?.count ?? 0),
		page: safePage,
		limit: safeLimit,
		totalPages: Math.ceil(Number(totalRows[0]?.count ?? 0) / safeLimit),
	};
}

