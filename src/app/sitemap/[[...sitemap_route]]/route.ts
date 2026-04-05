import { getAllBlogSlugs } from "@/queries/blog";
import { BLOG_TAGS } from "@/lib/blog-tags";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const sitemapSize = 10000;

function resolveSiteOrigin(request: NextRequest): string {
	const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
	if (env) {
		return env.replace(/\/$/, "");
	}
	return request.nextUrl.origin.replace(/\/$/, "");
}

type StaticRoute = {
	loc: string;
	lastmod: string;
	changefreq: string;
	priority: number;
};

function buildStaticRoutes(origin: string): StaticRoute[] {
	const lastmod = new Date().toISOString();
	const topicTags = [...BLOG_TAGS].sort((a, b) => a.slug.localeCompare(b.slug));

	return [
		{ loc: origin, lastmod, changefreq: "daily", priority: 1.0 },
		{ loc: `${origin}/archive`, lastmod, changefreq: "daily", priority: 0.9 },
		{ loc: `${origin}/about`, lastmod, changefreq: "weekly", priority: 0.8 },
		{ loc: `${origin}/search`, lastmod, changefreq: "weekly", priority: 0.65 },
		{ loc: `${origin}/faq`, lastmod, changefreq: "weekly", priority: 0.65 },
		{ loc: `${origin}/contact`, lastmod, changefreq: "monthly", priority: 0.65 },
		{ loc: `${origin}/changelog`, lastmod, changefreq: "weekly", priority: 0.55 },
		{
			loc: `${origin}/community-guidelines`,
			lastmod,
			changefreq: "monthly",
			priority: 0.55,
		},
		{ loc: `${origin}/privacy-policy`, lastmod, changefreq: "weekly", priority: 0.8 },
		{ loc: `${origin}/terms-of-service`, lastmod, changefreq: "weekly", priority: 0.8 },
		{ loc: `${origin}/feed.xml`, lastmod, changefreq: "daily", priority: 0.5 },
		...topicTags.map((t) => ({
			loc: `${origin}/topics/${t.slug}`,
			lastmod,
			changefreq: "weekly",
			priority: 0.75,
		})),
	];
}

function isSitemapIndexPath(pathname: string, sitemap_route: string[]): boolean {
	if (pathname === "/sitemap.xml") return true;
	if (pathname === "/sitemap" && sitemap_route.length === 0) return true;
	if (sitemap_route.length === 1 && sitemap_route[0] === "sitemap.xml") return true;
	return false;
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ sitemap_route?: string[] }> },
) {
	const { sitemap_route = [] } = await params;
	const pathname = request.nextUrl.pathname;
	const origin = resolveSiteOrigin(request);
	const staticRoutes = buildStaticRoutes(origin);

	if (isSitemapIndexPath(pathname, sitemap_route)) {
		const allBlogs = await getAllBlogSlugs();
		const totalSitemaps = Math.ceil(allBlogs.length / sitemapSize) || 1;

		const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
         http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  ${Array.from(
			{ length: totalSitemaps },
			(_, i) => `
  <sitemap>
    <loc>${origin}/sitemap/sitemap-${i}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`,
		).join("")}
</sitemapindex>`;

		return new NextResponse(sitemapIndex, {
			headers: { "Content-Type": "application/xml" },
		});
	}

	if (
		sitemap_route.length === 1 &&
		sitemap_route[0].startsWith("sitemap-") &&
		sitemap_route[0].endsWith(".xml")
	) {
		const idStr = sitemap_route[0].replace("sitemap-", "").replace(".xml", "");
		const id = parseInt(idStr, 10);

		if (isNaN(id) || id < 0) {
			return new NextResponse("Not Found", { status: 404 });
		}

		const allBlogs = await getAllBlogSlugs();
		const totalSitemaps = Math.ceil(allBlogs.length / sitemapSize) || 1;

		if (id >= totalSitemaps) {
			return new NextResponse("Not Found", { status: 404 });
		}

		const start = id * sitemapSize;
		const end = start + sitemapSize;
		const blogSlice = allBlogs.slice(start, end);

		const urls = blogSlice
			.map(
				(blog) => `
  <url>
    <loc>${origin}/blogs/${blog.slug}</loc>
    <lastmod>${blog.updatedAt ? new Date(blog.updatedAt).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`,
			)
			.join("");

		let staticUrls = "";
		if (id === 0) {
			staticUrls = staticRoutes
				.map(
					(route) => `
  <url>
    <loc>${route.loc}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
				)
				.join("");
		}

		const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
         http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  ${staticUrls}
  ${urls}
</urlset>`;

		return new NextResponse(sitemap, {
			headers: {
				"Content-Type": "application/xml",
				"Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
			},
		});
	}

	return new NextResponse("Not Found", { status: 404 });
}
