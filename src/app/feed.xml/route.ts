import { NextResponse } from "next/server";
import { getRecentBlogsForFeed } from "@/queries/blog";
import { siteBaseUrl } from "@/lib/json-ld";
import { buildBlogRssXml } from "@/lib/rss-feed";

export async function GET() {
	const base = siteBaseUrl();
	if (!base) {
		return new NextResponse("Missing NEXT_PUBLIC_APP_URL", { status: 500 });
	}

	const rows = await getRecentBlogsForFeed(100);
	const items = rows.map((row) => {
		const raw =
			row.excerpt?.trim() ||
			row.metaDescription?.trim() ||
			row.title;
		const description =
			raw.length > 500 ? `${raw.slice(0, 497)}…` : raw;
		const publishedAt = row.createdAt;
		return {
			title: row.title,
			url: `${base}/articles/${row.slug}`,
			publishedAt,
			description,
		};
	});

	const xml = buildBlogRssXml(base, items);

	return new NextResponse(xml, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=300, stale-while-revalidate=600",
		},
	});
}
