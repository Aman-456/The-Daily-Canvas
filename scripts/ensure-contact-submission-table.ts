/**
 * Creates contact_submission if missing (idempotent).
 *
 *   npx tsx scripts/ensure-contact-submission-table.ts
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
		CREATE TABLE IF NOT EXISTS "contact_submission" (
			"id" text PRIMARY KEY NOT NULL,
			"name" text NOT NULL,
			"email" text NOT NULL,
			"message" text NOT NULL,
			"createdAt" timestamp DEFAULT now() NOT NULL
		);
	`;

	await sql`
		ALTER TABLE "contact_submission" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'new' NOT NULL;
	`;

	console.log('Table "contact_submission" is ready (including status column).');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
