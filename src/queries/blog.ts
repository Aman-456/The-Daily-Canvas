import { db } from "@/db/index";
import { blogs, users } from "@/db/schema";
import { unstable_cache } from "next/cache";
import { eq, desc, sql, ilike, and } from "drizzle-orm";

const cacheTTL = 86400; // 24 hours
const allBlogsCacheTTL = 172800; // 48 hours

export const getBlogsCached = async (
	page: number,
	limit: number,
	search?: string,
) => {
	// 1. IF SEARCHING: Bypass cache entirely
	if (search) {
		const offset = (page - 1) * limit;
		const whereClause = and(
			eq(blogs.isPublished, true),
			ilike(blogs.title, `%${search}%`)
		);

		const query = db.select({
			_id: blogs.id,
			title: blogs.title,
			slug: blogs.slug,
			excerpt: blogs.excerpt,
			coverImage: blogs.coverImage,
			createdAt: blogs.createdAt,
			content: blogs.content,
			commentsCount: blogs.commentsCount,
			authorId: {
				_id: users.id,
				name: users.name,
				image: users.image
			}
		})
			.from(blogs)
			.leftJoin(users, eq(blogs.authorId, users.id))
			.where(whereClause);

		const [totalResult, blogsData] = await Promise.all([
			db.select({ count: sql<number>`count(*)` })
				.from(blogs)
				.where(whereClause),
			query.orderBy(desc(blogs.createdAt)).limit(limit).offset(offset)
		]);

		return {
			blogs: blogsData,
			total: totalResult[0].count,
			totalPages: Math.ceil(totalResult[0].count / limit),
		};
	}

	// 2. IF NOT SEARCHING: Use the cached version
	const fetchWithCache = unstable_cache(
		async () => {
			const offset = (page - 1) * limit;
			const [totalResult, blogsData] = await Promise.all([
				db.select({ count: sql<number>`count(*)` })
					.from(blogs)
					.where(eq(blogs.isPublished, true)),
				db.select({
					_id: blogs.id,
					title: blogs.title,
					slug: blogs.slug,
					excerpt: blogs.excerpt,
					coverImage: blogs.coverImage,
					createdAt: blogs.createdAt,
					content: blogs.content,
					commentsCount: blogs.commentsCount,
					authorId: {
						_id: users.id,
						name: users.name,
						image: users.image
					}
				})
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
		["blogs-list", page.toString(), limit.toString()],
		{
			revalidate: allBlogsCacheTTL,
			tags: ["blogs"],
		},
	);
	const res = fetchWithCache();

	return res;
};

export const getBlogBySlugCached = unstable_cache(
	async (slug: string) => {
		const result = await db.select({
			_id: blogs.id,
			title: blogs.title,
			slug: blogs.slug,
			content: blogs.content,
			excerpt: blogs.excerpt,
			coverImage: blogs.coverImage,
			isPublished: blogs.isPublished,
			createdAt: blogs.createdAt,
			updatedAt: blogs.updatedAt,
			tags: blogs.tags,
			commentsCount: blogs.commentsCount,
			metaTitle: blogs.metaTitle,
			metaDescription: blogs.metaDescription,
			keywords: blogs.keywords,
			authorId: {
				_id: users.id,
				name: users.name,
				image: users.image
			}
		})
			.from(blogs)
			.leftJoin(users, eq(blogs.authorId, users.id))
			.where(and(eq(blogs.slug, slug), eq(blogs.isPublished, true)));

		return result[0] || null;
	},
	["blog-single"],
	{ revalidate: cacheTTL, tags: ["blogs"] },
);

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
