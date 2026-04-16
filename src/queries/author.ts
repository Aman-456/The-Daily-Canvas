import { db } from "@/db/index";
import { blogs, users } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { blogSummarySelector } from "@/db/selectors";

export type PublicAuthor = {
	id: string;
	name: string | null;
	username: string | null;
	image: string | null;
	bio: string | null;
	createdAt: Date;
};

export async function getPublicAuthorByUsername(
	username: string,
): Promise<PublicAuthor | null> {
	const u = username.trim().toLowerCase();
	if (!u) return null;

	const rows = await db
		.select({
			id: users.id,
			name: users.name,
			username: users.username,
			image: users.image,
			bio: users.bio,
			createdAt: users.createdAt,
		})
		.from(users)
		.where(and(eq(users.username, u), eq(users.isDisabled, false)))
		.limit(1);

	return rows[0] ?? null;
}

export async function getPublishedArticlesByAuthorId(
	authorId: string,
	page: number,
	limit: number,
) {
	const safePage = Math.max(1, Number.isFinite(page) ? page : 1);
	const safeLimit = Math.min(50, Math.max(1, Number.isFinite(limit) ? limit : 10));
	const offset = (safePage - 1) * safeLimit;

	const whereClause = and(eq(blogs.authorId, authorId), eq(blogs.isPublished, true));

	const [totalResult, items] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(blogs).where(whereClause),
		db
			.select(blogSummarySelector)
			.from(blogs)
			.leftJoin(users, eq(blogs.authorId, users.id))
			.where(whereClause)
			.orderBy(desc(blogs.createdAt))
			.limit(safeLimit)
			.offset(offset),
	]);

	const total = Number(totalResult[0]?.count ?? 0);
	return {
		articles: items,
		total,
		totalPages: Math.ceil(total / safeLimit),
		page: safePage,
		limit: safeLimit,
	};
}

export async function getAuthorStats(authorId: string) {
	const [countRow] = await db
		.select({ count: sql<number>`count(*)` })
		.from(blogs)
		.where(and(eq(blogs.authorId, authorId), eq(blogs.isPublished, true)));

	// Rough “topics they write about”: top tags by frequency for published articles.
	// Uses SQL unnest on Postgres.
	const topTags = await db.execute(
		sql`
			select tag, count(*)::int as n
			from (
				select unnest(${blogs.tags}) as tag
				from ${blogs}
				where ${blogs.authorId} = ${authorId} and ${blogs.isPublished} = true
			) t
			where tag is not null and tag <> ''
			group by tag
			order by n desc, tag asc
			limit 12
		`,
	);

	return {
		articleCount: Number(countRow?.count ?? 0),
		topTags: (topTags as any)?.rows
			? ((topTags as any).rows as { tag: string; n: number }[])
			: [],
	};
}

