/**
 * Adds `viewCount` to `blog` if missing (idempotent).
 *
 *   npx tsx scripts/ensure-blog-view-count.ts
 *
 * Prefer `npm run db:migrate` when migrations are fully synced; use this for a quick column add.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
	const url = process.env.DATABASE_URL?.trim();
	if (!url) {
		console.error("DATABASE_URL is not set. Add it to .env or .env.local.");
		process.exit(1);
	}

	const sql = neon(url);

	await sql`
		ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "viewCount" integer DEFAULT 0 NOT NULL;
	`;

	console.log('Column "blog"."viewCount" is ready.');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
