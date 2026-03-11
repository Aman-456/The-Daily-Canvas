import dbConnect from "@/lib/mongoose";
import Blog, { IBlog } from "@/models/Blog";
import "@/models/User"; // Import User model to register it for population
import { unstable_cache } from "next/cache";

const cacheTTL = 1800; // 30 minutes

export const getBlogsCached = unstable_cache(
	async (page = 1, limit = 10, search = "") => {
		await dbConnect();

		const query: any = { isPublished: true };
		if (search) {
			query.title = { $regex: search, $options: "i" };
		}

		const total = await Blog.countDocuments(query);
		const blogs = await Blog.find(query)
			.populate("authorId", "name image")
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.lean();

		return {
			blogs: JSON.parse(JSON.stringify(blogs)),
			total,
			totalPages: Math.ceil(total / limit),
		};
	},
	["blogs-list"],
	{ revalidate: cacheTTL, tags: ["blogs"] }, // 5 minutes = 300 seconds
);

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
	{ revalidate: cacheTTL, tags: ["blogs"] }, // 5 minutes = 300 seconds
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
