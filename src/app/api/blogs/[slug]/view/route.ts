import { db } from "@/db/index";
import { blogs } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

const SLUG_MAX = 256;

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

	const updated = await db
		.update(blogs)
		.set({ viewCount: sql`${blogs.viewCount} + 1` })
		.where(and(eq(blogs.slug, slug), eq(blogs.isPublished, true)))
		.returning({ viewCount: blogs.viewCount });

	const row = updated[0];
	if (!row) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	return NextResponse.json({ viewCount: row.viewCount });
}
