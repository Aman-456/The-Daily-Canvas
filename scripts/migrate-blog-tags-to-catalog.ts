/**
 * Rewrites every blog’s `tags` array to canonical slugs from `src/lib/blog-tags.ts`,
 * using existing tags + keywords (and title words as a last resort).
 *
 *   npx tsx scripts/migrate-blog-tags-to-catalog.ts
 *   MIGRATE_TAGS_DRY_RUN=1 npx tsx scripts/migrate-blog-tags-to-catalog.ts
 *
 * Requires DATABASE_URL (see .env).
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import * as schema from "../src/db/schema";
import {
	normalizeBlogTagSlugs,
	resolveToBlogTagSlug,
} from "../src/lib/blog-tags";

dotenv.config();

const MAX_TAGS = 8;

/** When nothing maps to the catalog, keep one on-topic default slug. */
const FALLBACK_SLUG = "essay" as const;

function titleTokens(title: string): string[] {
	return title
		.split(/[^\p{L}\p{N}]+/u)
		.map((s) => s.trim())
		.filter((s) => s.length > 2);
}

/** Flatten tags/keywords into tokens (commas, spaces, semicolons). */
function mergeTagSources(
	tags: string[] | null,
	keywords: string[] | null,
): string[] {
	const merged: string[] = [];
	for (const t of tags ?? []) {
		if (t?.trim()) merged.push(t.trim());
	}
	for (const k of keywords ?? []) {
		if (!k?.trim()) continue;
		const s = k.trim();
		merged.push(s);
		for (const part of s.split(/[\s,;]+/)) {
			const p = part.trim();
			if (p) merged.push(p);
		}
	}
	return merged;
}

function normalizeRowTags(input: {
	tags: string[] | null;
	keywords: string[] | null;
	title: string;
}): string[] {
	const merged = mergeTagSources(input.tags, input.keywords);
	let out = normalizeBlogTagSlugs(merged);
	if (out.length >= MAX_TAGS) return out.slice(0, MAX_TAGS);

	for (const word of titleTokens(input.title)) {
		const slug = resolveToBlogTagSlug(word);
		if (slug && !out.includes(slug)) {
			out.push(slug);
			if (out.length >= MAX_TAGS) break;
		}
	}

	if (out.length === 0) {
		out = [FALLBACK_SLUG];
	}

	return out;
}

function sameTags(a: string[], b: string[]) {
	if (a.length !== b.length) return false;
	const sa = [...a].sort().join("\0");
	const sb = [...b].sort().join("\0");
	return sa === sb;
}

async function main() {
	const dryRun = process.env.MIGRATE_TAGS_DRY_RUN === "1";
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
		.from(schema.blogs);

	if (rows.length === 0) {
		console.log("No blogs in database.");
		return;
	}

	let changed = 0;
	for (const row of rows) {
		const current = row.tags ?? [];
		const next = normalizeRowTags({
			tags: current,
			keywords: row.keywords ?? null,
			title: row.title,
		});
		if (sameTags(current, next)) {
			console.log(`  ${row.slug} — unchanged [${next.join(", ")}]`);
			continue;
		}
		changed++;
		console.log(`  ${row.slug} — [${current.join(", ")}] → [${next.join(", ")}]`);
		if (!dryRun) {
			await db
				.update(schema.blogs)
				.set({
					tags: next,
					updatedAt: new Date(),
				})
				.where(eq(schema.blogs.id, row.id));
		}
	}

	console.log(
		`\n${dryRun ? "[dry-run] Would change" : "Changed"} ${changed} of ${rows.length} blog(s).`,
	);
	if (dryRun) {
		console.log("Unset MIGRATE_TAGS_DRY_RUN or set to 0 to apply.");
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
