import { db } from "@/db/index";
import { blogs, users } from "@/db/schema";
import { unstable_cache } from "next/cache";
import { eq, desc, sql, ilike, and, arrayContains } from "drizzle-orm";
import { isBlogTagSlug } from "@/lib/blog-tags";

import { blogSummarySelector, blogFullSelector } from "@/db/selectors";

const cacheTTL = 86400; // 24 hours
const allBlogsCacheTTL = 172800; // 48 hours

const _getCachedBlogsList = unstable_cache(
	async (page: number, limit: number) => {
		const offset = (page - 1) * limit;
		const [totalResult, blogsData] = await Promise.all([
			db.select({ count: sql<number>`count(*)` })
				.from(blogs)
				.where(eq(blogs.isPublished, true)),
			db.select(blogSummarySelector)
				.from(blogs)
				.leftJoin(users, eq(blogs.authorId, users.id))
				.where(eq(blogs.isPublished, true))
				.orderBy(desc(blogs.createdAt))
				.limit(limit)
				.offset(offset)
		]);

		return {
			blogs: blogsData,
			total: totalResult[0].count,
			totalPages: Math.ceil(totalResult[0].count / limit),
		};
	},
	["blogs-list"],
	{
		revalidate: allBlogsCacheTTL,
		tags: ["blogs"],
	},
);

export const getBlogsCached = async (
	page: number,
	limit: number,
	search?: string,
	tagSlugs?: string[],
) => {
	const hasSearch = Boolean(search?.trim());
	const validTags = [...new Set((tagSlugs ?? []).filter(isBlogTagSlug))].sort();
	const hasTagFilter = validTags.length > 0;

	if (hasSearch || hasTagFilter) {
		const offset = (page - 1) * limit;
		const conditions = [eq(blogs.isPublished, true)];
		if (hasSearch) {
			conditions.push(ilike(blogs.title, `%${search!.trim()}%`));
		}
		for (const t of validTags) {
			conditions.push(arrayContains(blogs.tags, [t]));
		}
		const whereClause = and(...conditions);

		const [totalResult, blogsData] = await Promise.all([
			db.select({ count: sql<number>`count(*)` })
				.from(blogs)
				.where(whereClause),
			db.select(blogSummarySelector)
				.from(blogs)
				.leftJoin(users, eq(blogs.authorId, users.id))
				.where(whereClause)
				.orderBy(desc(blogs.createdAt))
				.limit(limit)
				.offset(offset),
		]);

		return {
			blogs: blogsData,
			total: totalResult[0].count,
			totalPages: Math.ceil(totalResult[0].count / limit),
		};
	}

	return _getCachedBlogsList(page, limit);
};

const _getBlogSingleShared = async (idOrSlug: string, onlyPublished = true) => {
	// Some legacy data uses non-UUID ids (e.g. 24-char hex). To be resilient, try `id` first,
	// then fall back to `slug` if no row is found.
	const baseQuery = db
		.select(blogFullSelector)
		.from(blogs)
		.leftJoin(users, eq(blogs.authorId, users.id));

	const byIdWhere = onlyPublished
		? and(eq(blogs.id, idOrSlug), eq(blogs.isPublished, true))
		: eq(blogs.id, idOrSlug);

	const byId = await baseQuery.where(byIdWhere);
	if (byId[0]) return byId[0];

	const bySlugWhere = onlyPublished
		? and(eq(blogs.slug, idOrSlug), eq(blogs.isPublished, true))
		: eq(blogs.slug, idOrSlug);

	const bySlug = await baseQuery.where(bySlugWhere);
	return bySlug[0] || null;
};

const _getBlogBySlugCached = unstable_cache(
	async (slug: string) => _getBlogSingleShared(slug, true),
	["blog-single"],
	{ revalidate: cacheTTL, tags: ["blogs"] },
);

export const getBlogBySlugCached = (slug: string) => _getBlogBySlugCached(slug);

const _getBlogByIdCached = unstable_cache(
	async (id: string) => _getBlogSingleShared(id, false),
	["blog-id"],
	{ revalidate: cacheTTL, tags: ["blogs"] },
);

export const getBlogByIdCached = (id: string) => _getBlogByIdCached(id);



export const getAllBlogSlugs = async () => {
	const result = await db.select({
		slug: blogs.slug,
		updatedAt: blogs.updatedAt,
		createdAt: blogs.createdAt,
	})
		.from(blogs)
		.where(eq(blogs.isPublished, true));

	return result.map((blog) => ({
		slug: blog.slug,
		updatedAt: blog.updatedAt || blog.createdAt,
	}));
};
