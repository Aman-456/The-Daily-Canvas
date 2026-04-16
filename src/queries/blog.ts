import { db } from "@/db/index";
import { blogs, users, articleVotes } from "@/db/schema";
import { unstable_cache } from "next/cache";
import {
	eq,
	ne,
	desc,
	asc,
	sql,
	ilike,
	and,
	arrayContains,
	arrayOverlaps,
	not,
	notInArray,
} from "drizzle-orm";
import { isBlogTagSlug } from "@/lib/blog-tags";
import type { BlogListSort } from "@/lib/blog-list-sort";
import { parseBlogListSort } from "@/lib/blog-list-sort";

import { blogSummarySelector, blogFullSelector } from "@/db/selectors";

const cacheTTL = 86400; // 24 hours
const allBlogsCacheTTL = 172800; // 48 hours

const _getCachedBlogsList = unstable_cache(
	async (page: number, limit: number) => {
		const offset = (page - 1) * limit;
		const [totalResult, blogsData] = await Promise.all([
			db.select({ count: sql<number>`count(*)` })
				.from(blogs)
				.where(and(eq(blogs.isPublished, true), eq(blogs.isHidden, false))),
			db.select(blogSummarySelector)
				.from(blogs)
				.leftJoin(users, eq(blogs.authorId, users.id))
				.where(and(eq(blogs.isPublished, true), eq(blogs.isHidden, false)))
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

export type GetBlogsListOptions = {
	/** Omit these slugs from the result (e.g. home feed vs spotlight strip). */
	excludeSlugs?: string[];
	sort?: BlogListSort;
};

function normalizeSlugList(slugs: string[] | undefined): string[] {
	return [...new Set((slugs ?? []).map((s) => s.trim()).filter(Boolean))].sort();
}

/**
 * Home teaser list excluding a small set of slugs (e.g. featured mosaic).
 * Cached so home doesn't hit DB per request when excluding featured items.
 */
const _getHomeTeaserExcludingSlugsCached = unstable_cache(
	async (limit: number, sort: BlogListSort, excludeSlugsSortedCsv: string) => {
		const excludeSlugs =
			excludeSlugsSortedCsv.trim().length > 0
				? excludeSlugsSortedCsv.split(",").filter(Boolean)
				: [];
		const orderBy = orderByForBlogList(sort);
		const whereClause =
			excludeSlugs.length > 0
				? and(
						eq(blogs.isPublished, true),
						eq(blogs.isHidden, false),
						notInArray(blogs.slug, excludeSlugs),
					)
				: and(eq(blogs.isPublished, true), eq(blogs.isHidden, false));

		const [totalResult, blogsData] = await Promise.all([
			db.select({ count: sql<number>`count(*)` }).from(blogs).where(whereClause),
			db.select(blogSummarySelector)
				.from(blogs)
				.leftJoin(users, eq(blogs.authorId, users.id))
				.where(whereClause)
				.orderBy(...orderBy)
				.limit(limit),
		]);

		return {
			blogs: blogsData,
			total: Number(totalResult[0]?.count ?? 0),
		};
	},
	["home-teaser-excluding-slugs-v1"],
	{ revalidate: 3600, tags: ["blogs"] },
);

export async function getHomeTeaserExcludingSlugsCached(params: {
	limit: number;
	sort?: BlogListSort;
	excludeSlugs?: string[];
}) {
	const sort = parseBlogListSort(params.sort);
	const limit = Math.min(50, Math.max(1, Math.floor(params.limit)));
	const excludeSlugsSorted = normalizeSlugList(params.excludeSlugs);
	return _getHomeTeaserExcludingSlugsCached(limit, sort, excludeSlugsSorted.join(","));
}

/**
 * One-call home payload so `page.tsx` doesn't do multiple awaits.
 * Returns spotlight strip plus a teaser list that excludes the featured mosaic items.
 */
const _getHomeSpotlightAndTeaserCached = unstable_cache(
	async (params: {
		teaserLimit: number;
		sort: BlogListSort;
		featuredMosaicCount: number;
	}) => {
		const spotlight = await _getSpotlightStrip();
		const featuredMosaicCount = Math.min(
			8,
			Math.max(0, Math.floor(params.featuredMosaicCount)),
		);
		const excludeSlugs =
			featuredMosaicCount > 0
				? (spotlight.items ?? [])
						.slice(0, featuredMosaicCount)
						.map((b) => b.slug)
						.filter(Boolean)
				: [];
		const teaser = await _getHomeTeaserExcludingSlugsCached(
			Math.min(50, Math.max(1, Math.floor(params.teaserLimit))),
			params.sort,
			normalizeSlugList(excludeSlugs).join(","),
		);
		return { spotlight, teaser };
	},
	["home-spotlight-and-teaser-v1"],
	{ revalidate: 3600, tags: ["blogs"] },
);

export async function getHomeSpotlightAndTeaserCached(params: {
	teaserLimit: number;
	sort?: BlogListSort;
	featuredMosaicCount?: number;
}) {
	const teaserLimit = Math.min(50, Math.max(1, Math.floor(params.teaserLimit)));
	const sort = parseBlogListSort(params.sort);
	const featuredMosaicCount =
		typeof params.featuredMosaicCount === "number"
			? params.featuredMosaicCount
			: 4;
	return _getHomeSpotlightAndTeaserCached({
		teaserLimit,
		sort,
		featuredMosaicCount,
	});
}

function orderByForBlogList(sort: BlogListSort) {
	switch (sort) {
		case "oldest":
			return [asc(blogs.createdAt)];
		case "most-viewed":
			return [desc(blogs.viewCount), desc(blogs.createdAt)];
		case "most-commented":
			return [desc(blogs.commentsCount), desc(blogs.createdAt)];
		case "title":
			return [asc(sql`lower(${blogs.title})`)];
		default:
			return [desc(blogs.createdAt)];
	}
}

export async function getBlogsForSearch2(params: {
	page: number;
	limit: number;
	search?: string;
	includeTags?: string[];
	excludeTags?: string[];
	authorUsername?: string;
	minScore?: number;
	sort?: BlogListSort;
}) {
	const sort = parseBlogListSort(params.sort);
	const safePage = Math.max(1, Number.isFinite(params.page) ? params.page : 1);
	const safeLimit = Math.min(50, Math.max(1, Number.isFinite(params.limit) ? params.limit : 12));
	const offset = (safePage - 1) * safeLimit;

	const includeTags = [...new Set((params.includeTags ?? []).filter(isBlogTagSlug))].sort();
	const excludeTags = [...new Set((params.excludeTags ?? []).filter(isBlogTagSlug))].sort();
	const authorUsername = (params.authorUsername ?? "").trim().toLowerCase();
	const hasSearch = Boolean(params.search?.trim());
	const minScoreRaw = params.minScore;
	const minScore =
		typeof minScoreRaw === "number" && Number.isFinite(minScoreRaw) ? Math.floor(minScoreRaw) : undefined;

	const conditions: any[] = [eq(blogs.isPublished, true), eq(blogs.isHidden, false)];

	if (hasSearch) {
		conditions.push(ilike(blogs.title, `%${params.search!.trim()}%`));
	}
	for (const t of includeTags) {
		conditions.push(arrayContains(blogs.tags, [t]));
	}
	if (excludeTags.length > 0) {
		conditions.push(not(arrayOverlaps(blogs.tags, excludeTags)));
	}
	if (authorUsername) {
		conditions.push(eq(users.username, authorUsername));
		conditions.push(eq(users.isDisabled, false));
	}

	const whereClause = and(...conditions);

	// Votes aggregate (used for sort=top or minScore).
	const votesAgg = db
		.select({
			blogId: articleVotes.blogId,
			score: sql<number>`coalesce(sum(${articleVotes.value}), 0)`,
		})
		.from(articleVotes)
		.groupBy(articleVotes.blogId)
		.as("votes");

	const baseFrom = db
		.select(blogSummarySelector)
		.from(blogs)
		.leftJoin(users, eq(blogs.authorId, users.id))
		.where(whereClause)
		.$dynamic();

	const baseCount = db
		.select({ count: sql<number>`count(*)` })
		.from(blogs)
		.leftJoin(users, eq(blogs.authorId, users.id))
		.where(whereClause)
		.$dynamic();

	const needsVotes = sort === "top" || typeof minScore === "number";

	const listQuery = needsVotes
		? baseFrom
				.leftJoin(votesAgg, eq(votesAgg.blogId, blogs.id))
				.where(
					typeof minScore === "number"
						? and(whereClause, sql`coalesce(${votesAgg.score}, 0) >= ${minScore}`)
						: whereClause,
				)
		: baseFrom;

	const countQuery = needsVotes
		? baseCount
				.leftJoin(votesAgg, eq(votesAgg.blogId, blogs.id))
				.where(
					typeof minScore === "number"
						? and(whereClause, sql`coalesce(${votesAgg.score}, 0) >= ${minScore}`)
						: whereClause,
				)
		: baseCount;

	const orderBy =
		sort === "top"
			? [desc(sql`coalesce(${votesAgg.score}, 0)`), desc(blogs.createdAt)]
			: orderByForBlogList(sort);

	const [totalResult, blogsData] = await Promise.all([
		countQuery,
		listQuery.orderBy(...orderBy).limit(safeLimit).offset(offset),
	]);

	const total = Number(totalResult[0]?.count ?? 0);
	return {
		blogs: blogsData,
		total,
		totalPages: Math.ceil(total / safeLimit),
		page: safePage,
		limit: safeLimit,
	};
}

export const getBlogsCached = async (
	page: number,
	limit: number,
	search?: string,
	tagSlugs?: string[],
	options?: GetBlogsListOptions,
) => {
	const sort = parseBlogListSort(options?.sort);
	const hasSearch = Boolean(search?.trim());
	const validTags = [...new Set((tagSlugs ?? []).filter(isBlogTagSlug))].sort();
	const hasTagFilter = validTags.length > 0;
	const excludeSlugs = [...new Set((options?.excludeSlugs ?? []).filter(Boolean))];
	const orderBy = orderByForBlogList(sort);

	if (hasSearch || hasTagFilter) {
		const offset = (page - 1) * limit;
		const conditions = [eq(blogs.isPublished, true), eq(blogs.isHidden, false)];
		if (hasSearch) {
			conditions.push(ilike(blogs.title, `%${search!.trim()}%`));
		}
		for (const t of validTags) {
			conditions.push(arrayContains(blogs.tags, [t]));
		}
		if (excludeSlugs.length > 0) {
			conditions.push(notInArray(blogs.slug, excludeSlugs));
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
				.orderBy(...orderBy)
				.limit(limit)
				.offset(offset),
		]);

		return {
			blogs: blogsData,
			total: totalResult[0].count,
			totalPages: Math.ceil(totalResult[0].count / limit),
		};
	}

	if (excludeSlugs.length > 0) {
		const offset = (page - 1) * limit;
		const whereClause = and(
			eq(blogs.isPublished, true),
			eq(blogs.isHidden, false),
			notInArray(blogs.slug, excludeSlugs),
		);

		const [totalResult, blogsData] = await Promise.all([
			db.select({ count: sql<number>`count(*)` })
				.from(blogs)
				.where(whereClause),
			db.select(blogSummarySelector)
				.from(blogs)
				.leftJoin(users, eq(blogs.authorId, users.id))
				.where(whereClause)
				.orderBy(...orderBy)
				.limit(limit)
				.offset(offset),
		]);

		return {
			blogs: blogsData,
			total: totalResult[0].count,
			totalPages: Math.ceil(totalResult[0].count / limit),
		};
	}

	if (sort !== "newest") {
		const offset = (page - 1) * limit;
		const [totalResult, blogsData] = await Promise.all([
			db.select({ count: sql<number>`count(*)` })
				.from(blogs)
				.where(and(eq(blogs.isPublished, true), eq(blogs.isHidden, false))),
			db.select(blogSummarySelector)
				.from(blogs)
				.leftJoin(users, eq(blogs.authorId, users.id))
				.where(and(eq(blogs.isPublished, true), eq(blogs.isHidden, false)))
				.orderBy(...orderBy)
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
		? and(eq(blogs.id, idOrSlug), eq(blogs.isPublished, true), eq(blogs.isHidden, false))
		: eq(blogs.id, idOrSlug);

	const byId = await baseQuery.where(byIdWhere);
	if (byId[0]) return byId[0];

	const bySlugWhere = onlyPublished
		? and(eq(blogs.slug, idOrSlug), eq(blogs.isPublished, true), eq(blogs.isHidden, false))
		: eq(blogs.slug, idOrSlug);

	const bySlug = await baseQuery.where(bySlugWhere);
	return bySlug[0] || null;
};

const _getBlogBySlugCached = unstable_cache(
	async (slug: string) => _getBlogSingleShared(slug, true),
	["blog-single-v2"],
	{ revalidate: cacheTTL, tags: ["blogs"] },
);

export const getBlogBySlugCached = (slug: string) => _getBlogBySlugCached(slug);

const _getBlogByIdCached = unstable_cache(
	async (id: string) => _getBlogSingleShared(id, false),
	["blog-id-v2"],
	{ revalidate: cacheTTL, tags: ["blogs"] },
);

export const getBlogByIdCached = (id: string) => _getBlogByIdCached(id);



/**
 * Home spotlight strip: one ordered list (not CMS-curated).
 * Ranking today: comment count, then recency — swap when you define “featured” rules.
 * Cached ~1h via `unstable_cache` + `revalidateTag("blogs")` on publish flows.
 */
const _getSpotlightStrip = unstable_cache(
	async () => {
		const items = await db
			.select(blogSummarySelector)
			.from(blogs)
			.leftJoin(users, eq(blogs.authorId, users.id))
			.where(and(eq(blogs.isPublished, true), eq(blogs.isHidden, false)))
			.orderBy(desc(blogs.commentsCount), desc(blogs.createdAt))
			.limit(8);

		return { items };
	},
	["home-spotlight-strip"],
	{ revalidate: 3600, tags: ["blogs"] },
);

export const getSpotlightStrip = () => _getSpotlightStrip();

/** @deprecated use `getSpotlightStrip` */
export const getHomeSpotlight = getSpotlightStrip;

/**
 * Related posts by overlapping tags. Not admin-picked; not cached (runs per article view).
 */
export async function getRelatedBlogs(
	excludeId: string,
	tagSlugs: string[],
	limit = 4,
) {
	if (!tagSlugs.length) return [];
	return db
		.select(blogSummarySelector)
		.from(blogs)
		.leftJoin(users, eq(blogs.authorId, users.id))
		.where(
			and(
				eq(blogs.isPublished, true),
				eq(blogs.isHidden, false),
				ne(blogs.id, excludeId),
				arrayOverlaps(blogs.tags, tagSlugs),
			),
		)
		.orderBy(desc(blogs.commentsCount), desc(blogs.createdAt))
		.limit(limit);
}

/** Recent published posts for RSS (not cached; feed should stay fresh). */
export async function getRecentBlogsForFeed(limit = 100) {
	return db
		.select({
			slug: blogs.slug,
			title: blogs.title,
			excerpt: blogs.excerpt,
			metaDescription: blogs.metaDescription,
			updatedAt: blogs.updatedAt,
			createdAt: blogs.createdAt,
		})
		.from(blogs)
		.where(and(eq(blogs.isPublished, true), eq(blogs.isHidden, false)))
		.orderBy(desc(blogs.createdAt))
		.limit(limit);
}

export const getAllBlogSlugs = async () => {
	const result = await db.select({
		slug: blogs.slug,
		updatedAt: blogs.updatedAt,
		createdAt: blogs.createdAt,
	})
		.from(blogs)
		.where(and(eq(blogs.isPublished, true), eq(blogs.isHidden, false)));

	return result.map((blog) => ({
		slug: blog.slug,
		updatedAt: blog.updatedAt || blog.createdAt,
	}));
};

/**
 * Live view total for a published post. Not wrapped in `unstable_cache` so it does not
 * affect or bloat the cached blog body from `getBlogBySlugCached` (which omits `viewCount`).
 */
export async function getBlogViewCountBySlug(slug: string): Promise<number> {
	const row = await db
		.select({ viewCount: blogs.viewCount })
		.from(blogs)
		.where(and(eq(blogs.slug, slug), eq(blogs.isPublished, true)))
		.limit(1);
	return row[0]?.viewCount ?? 0;
}
