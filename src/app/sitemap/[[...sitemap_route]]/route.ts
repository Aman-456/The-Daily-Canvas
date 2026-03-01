import { getAllBlogSlugs } from "@/queries/blog";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const sitemapSize = 10000;
const APP_URL =
	process.env.NEXT_PUBLIC_APP_URL || "https://the-daily-canvas.vercel.app";

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
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
    <changefreq>daily</changefreq>  <!-- adjusted from daily -->
    <priority>0.9</priority>         <!-- slightly lower than homepage -->
  </url>`,
			)
			.join("");

		let staticUrls = "";
		if (id === 0) {
			staticUrls = `
  <url>
    <loc>${APP_URL}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${APP_URL}/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
		}

		const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
