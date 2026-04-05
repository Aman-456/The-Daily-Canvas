/**
 * Creates newsletter_subscriber if missing (idempotent).
 * Uses DATABASE_URL from .env — same as the app.
 *
 *   npx tsx scripts/ensure-newsletter-table.ts
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
		CREATE TABLE IF NOT EXISTS newsletter_subscriber (
			id text PRIMARY KEY NOT NULL,
			email text NOT NULL,
			"createdAt" timestamp DEFAULT now() NOT NULL,
			CONSTRAINT newsletter_subscriber_email_unique UNIQUE (email)
		);
	`;

	console.log("Table newsletter_subscriber is ready.");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
