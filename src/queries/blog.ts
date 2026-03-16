import dbConnect from "@/lib/mongoose";
import Blog, { IBlog } from "@/models/Blog";
import "@/models/User"; // Import User model to register it for population
import { unstable_cache } from "next/cache";

const cacheTTL = 86400; // 24 hours
const allBlogsCacheTTL = 172800; // 48 hours

export const getBlogsCached = async (
	page: number,
	limit: number,
	search?: string,
) => {
	// 1. IF SEARCHING: Bypass cache entirely
	if (Boolean(search)) {
		await dbConnect();
		const query = {
			isPublished: true,
			title: { $regex: search, $options: "i" },
		};

		const [total, blogs] = await Promise.all([
			Blog.countDocuments(query),
			Blog.find(query)
				.populate("authorId", "name image")
				.sort({ createdAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit)
				.lean(),
		]);

		return {
			blogs: JSON.parse(JSON.stringify(blogs)),
			total,
			totalPages: Math.ceil(total / limit),
		};
	}

	// 2. IF NOT SEARCHING: Use the cached version
	const fetchWithCache = unstable_cache(
		async () => {
			await dbConnect();
			const query = { isPublished: true };

			const [total, blogs] = await Promise.all([
				Blog.countDocuments(query),
				Blog.find(query)
					.populate("authorId", "name image")
					.sort({ createdAt: -1 })
					.skip((page - 1) * limit)
					.limit(limit)
					.lean(),
			]);

			return {
				blogs: JSON.parse(JSON.stringify(blogs)),
				total,
				totalPages: Math.ceil(total / limit),
			};
		},
		["blogs-list", page.toString(), limit.toString()],
		{
			revalidate: allBlogsCacheTTL,
			tags: ["blogs"],
		},
	);

	return fetchWithCache();
};

export const getBlogBySlugCached = unstable_cache(
	async (slug: string) => {
		await dbConnect();
		const blog = await Blog.findOne({ slug, isPublished: true })
			.populate("authorId", "name image")
			.lean();

		if (!blog) return null;

		return JSON.parse(JSON.stringify(blog));
	},
	["blog-single"],
	{ revalidate: cacheTTL, tags: ["blogs"] },
);

export const getAllBlogSlugs = async () => {
	await dbConnect();
	const blogs = await Blog.find({ isPublished: true })
		.select("slug updatedAt")
		.lean();
	return blogs.map((blog) => ({
		slug: blog.slug,
		updatedAt: blog.updatedAt || blog.createdAt,
	}));
};
