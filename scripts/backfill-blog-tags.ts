/**
 * Sets `tags` for published blogs where tags are null or empty.
 * Uses existing `keywords` (first few unique, trimmed); otherwise ["Thoughts"].
 *
 *   npx tsx scripts/backfill-blog-tags.ts
 *   BACKFILL_TAGS_DRY_RUN=1 npx tsx scripts/backfill-blog-tags.ts
 *
 * Requires DATABASE_URL (see .env).
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql } from "drizzle-orm";
import * as dotenv from "dotenv";
import * as schema from "../src/db/schema";

dotenv.config();

const MAX_TAGS = 5;
const FALLBACK_TAGS = ["Thoughts"];

function tagsFromKeywords(keywords: string[] | null | undefined): string[] {
	if (!keywords?.length) return [...FALLBACK_TAGS];
	const seen = new Set<string>();
	const out: string[] = [];
	for (const k of keywords) {
		const t = typeof k === "string" ? k.trim() : "";
		if (!t || seen.has(t.toLowerCase())) continue;
		seen.add(t.toLowerCase());
		out.push(t);
		if (out.length >= MAX_TAGS) break;
	}
	return out.length > 0 ? out : [...FALLBACK_TAGS];
}

async function main() {
	const dryRun = process.env.BACKFILL_TAGS_DRY_RUN === "1";
	if (!process.env.DATABASE_URL) {
		console.error("Missing DATABASE_URL");
		process.exit(1);
	}

	const sqlClient = neon(process.env.DATABASE_URL);
	const db = drizzle({ client: sqlClient, schema });

	const rows = await db
		.select({
			id: schema.blogs.id,
			slug: schema.blogs.slug,
			title: schema.blogs.title,
			keywords: schema.blogs.keywords,
			tags: schema.blogs.tags,
		})
		.from(schema.blogs)
		.where(
			sql`(${schema.blogs.tags} IS NULL OR cardinality(${schema.blogs.tags}) = 0)`,
		);

	if (rows.length === 0) {
		console.log("No blogs need tag backfill.");
		return;
	}

	console.log(
		`${dryRun ? "[dry-run] Would update" : "Updating"} ${rows.length} blog(s).`,
	);

	for (const row of rows) {
		const nextTags = tagsFromKeywords(row.keywords ?? undefined);
		console.log(`  ${row.slug} → [${nextTags.join(", ")}]`);
		if (!dryRun) {
			await db
				.update(schema.blogs)
				.set({
					tags: nextTags,
					updatedAt: new Date(),
				})
				.where(eq(schema.blogs.id, row.id));
		}
	}

	if (dryRun) {
		console.log("Dry run only; set BACKFILL_TAGS_DRY_RUN=0 or unset to apply.");
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
