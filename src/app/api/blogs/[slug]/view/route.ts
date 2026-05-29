import { db } from "@/db/index";
import { blogs } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { firstSeenInWindow, getClientIp } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const SLUG_MAX = 256;
const VIEW_DEDUP_WINDOW = 6 * 3600; // one view per IP per post per 6h

/**
 * Increment published post views. Separate from cached blog reads so content stays cacheable.
 */
export async function POST(
	_request: Request,
	context: { params: Promise<{ slug: string }> },
) {
	const { slug: raw } = await context.params;
	const slug = raw?.trim() ?? "";
	if (!slug || slug.length > SLUG_MAX) {
		return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
	}

	// De-dupe: only count one view per IP per post within the window. Repeat
	// hits return the current total without incrementing.
	const ip = await getClientIp();
	const isFresh = await firstSeenInWindow(`view:${slug}:${ip}`, VIEW_DEDUP_WINDOW);
	if (!isFresh) {
		const [row] = await db
			.select({ viewCount: blogs.viewCount })
			.from(blogs)
			.where(and(eq(blogs.slug, slug), eq(blogs.isPublished, true)))
			.limit(1);
		if (!row) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}
		return NextResponse.json({ viewCount: row.viewCount, counted: false });
	}

	const updated = await db
		.update(blogs)
		.set({ viewCount: sql`${blogs.viewCount} + 1` })
		.where(and(eq(blogs.slug, slug), eq(blogs.isPublished, true)))
		.returning({ viewCount: blogs.viewCount });

	const row = updated[0];
	if (!row) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	return NextResponse.json({ viewCount: row.viewCount, counted: true });
}
