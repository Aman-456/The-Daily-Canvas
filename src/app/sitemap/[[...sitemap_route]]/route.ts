import { getAllBlogSlugs } from "@/queries/blog";
import { BLOG_TAGS } from "@/lib/blog-tags";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const sitemapSize = 10000;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// static routs

const staticRoutes = [
	{
		loc: APP_URL,
		lastmod: new Date().toISOString(),
		changefreq: "daily",
		priority: 1.0,
	},
	{
		loc: `${APP_URL}/about`,
		lastmod: new Date().toISOString(),
		changefreq: "weekly",
		priority: 0.8,
	},
	{
		loc: `${APP_URL}/terms-of-service`,
		lastmod: new Date().toISOString(),
		changefreq: "weekly",
		priority: 0.8,
	},
	{
		loc: `${APP_URL}/privacy-policy`,
		lastmod: new Date().toISOString(),
		changefreq: "weekly",
		priority: 0.8,
	},
	...BLOG_TAGS.map((t) => ({
		loc: `${APP_URL}/topics/${t.slug}`,
		lastmod: new Date().toISOString(),
		changefreq: "weekly" as const,
		priority: 0.75,
	})),
];

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ sitemap_route?: string[] }> },
) {
	const { sitemap_route = [] } = await params;
	const pathname = request.nextUrl.pathname; // e.g. "/sitemap.xml" or "/sitemap/sitemap-0.xml"

	// Handle sitemap index: /sitemap.xml
	if (
		pathname === "/sitemap.xml" ||
		(sitemap_route.length === 1 && sitemap_route[0] === "sitemap.xml")
	) {
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
    <loc>${APP_URL}/sitemap/sitemap-${i}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`,
		).join("")}
</sitemapindex>`;

		return new NextResponse(sitemapIndex, {
			headers: { "Content-Type": "application/xml" },
		});
	}

	// Handle segment: /sitemap/sitemap-X.xml
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
    <loc>${APP_URL}/blogs/${blog.slug}</loc>
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
