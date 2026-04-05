/**
 * Overwrites the `changelog` row in `pages` with content from `defaultCmsPage("changelog")`
 * in src/lib/cms-pages.ts. Use when the public /changelog page lags behind repo defaults.
 *
 *   npx tsx scripts/sync-changelog-from-default.ts
 *
 * Afterward: restart `next dev` or redeploy production so `unstable_cache` for pages refreshes.
 * Warning: replaces the entire Changelog HTML—any custom edits in Admin are lost.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db/index";
import { pages } from "../src/db/schema";
import { defaultCmsPage } from "../src/lib/cms-pages";

async function main() {
	const url = process.env.DATABASE_URL?.trim();
	if (!url) {
		console.error("DATABASE_URL is not set.");
		process.exit(1);
	}

	const def = defaultCmsPage("changelog");
	if (!def) {
		console.error("No default changelog in cms-pages.");
		process.exit(1);
	}

	const existing = await db.select().from(pages).where(eq(pages.slug, "changelog"));
	if (existing.length === 0) {
		await db.insert(pages).values({
			slug: "changelog",
			title: def.title,
			content: def.content,
		});
		console.log('Inserted new "changelog" page from default.');
	} else {
		await db
			.update(pages)
			.set({
				title: def.title,
				content: def.content,
				updatedAt: new Date(),
			})
			.where(eq(pages.slug, "changelog"));
		console.log('Updated "changelog" page from src/lib/cms-pages.ts default.');
	}

	console.log(
		"Restart next dev or redeploy so cached getPageBySlug(changelog) sees the new content.",
	);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
