/**
 * Seeds long-form blogs from Markdown files in scripts/seed-blog-contents/{slug}.md
 *
 * Insert (default): adds a row only if the slug does not exist.
 * Update: npx tsx scripts/seed-new-blogs.ts --update
 *   (or BLOG_SEED_UPDATE=1) — overwrites content, excerpt, meta fields, tags, title for existing slugs.
 *
 * Requires DATABASE_URL and a valid BLOG_SEED_AUTHOR_ID (user id) for inserts.
 */
import * as fs from "fs";
import * as path from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import * as schema from "../src/db/schema";

dotenv.config();

const CONTENT_DIR = path.join(process.cwd(), "scripts", "seed-blog-contents");

type SeedBlogMeta = {
	title: string;
	slug: string;
	excerpt: string;
	tags: string[];
	metaTitle: string;
	metaDescription: string;
	keywords: string[];
};

function loadMarkdown(slug: string): string {
	const fp = path.join(CONTENT_DIR, `${slug}.md`);
	if (!fs.existsSync(fp)) {
		throw new Error(`Missing markdown: ${fp}`);
	}
	return fs.readFileSync(fp, "utf8");
}

const SEED_BLOGS: SeedBlogMeta[] = [
	{
		title:
			"The Pump Shock Continues: Pakistan’s Petrol Math in 2026—and Who Really Sets the Price",
		slug: "pakistan-petrol-prices-2026-ogra-imf",
		excerpt:
			"At midnight the notification drops, and by dawn every household has a theory. The truth is a chain of crude benchmarks, rupee translation, OGRA’s arithmetic, and fiscal choices that absorb or pass through global shocks. Here is how Pakistan’s pump price machine actually works—and what to watch next.",
		tags: ["pakistan", "energy", "economics"],
		metaTitle: "Pakistan petrol prices 2026: OGRA, taxes, and global oil",
		metaDescription:
			"Long read: OGRA’s role, exchange-rate pass-through, petroleum levies, IMF fiscal context, and reference sources for Pakistan’s fuel pricing debate.",
		keywords: [
			"Pakistan petrol",
			"OGRA",
			"fuel prices",
			"PSO",
			"IMF Pakistan",
		],
	},
	{
		title:
			"Memory on Sale? Why RAM Prices Keep Sliding—and What It Means for Your Next PC",
		slug: "ram-dram-prices-falling-2026-pc-builders",
		excerpt:
			"DDR5 kits that once felt like a luxury tax are quietly normalizing. Behind the sticker sits the DRAM inventory cycle, AI’s hunger for HBM, and a few practical lessons for anyone upgrading a rig in 2026.",
		tags: ["technology", "hardware", "semiconductors"],
		metaTitle: "Why RAM prices are falling: DRAM cycle explained (2026)",
		metaDescription:
			"Long read: DRAM/NAND cycles, DDR5 adoption, HBM vs desktop memory, buying advice, and authoritative industry references.",
		keywords: ["RAM prices", "DDR5", "DRAM", "PC building", "memory"],
	},
	{
		title:
			"Rooftops vs. the Grid: Pakistan’s Solar Boom and the Net-Metering Tug-of-War",
		slug: "pakistan-solar-net-metering-rooftop-2026",
		excerpt:
			"Panels spread across Punjab and Sindh faster than some disco engineers expected. Net metering made the math sing—until fixed costs, voltage protection, and tariff design collided. This is the long view on fairness, reliability, and what policy will argue about next.",
		tags: ["pakistan", "energy", "environment"],
		metaTitle: "Pakistan rooftop solar & net metering: long read",
		metaDescription:
			"Net metering, distribution utilities, NEPRA, grid integration, and international parallels— with references.",
		keywords: [
			"Pakistan solar",
			"net metering",
			"renewable energy",
			"NEPRA",
		],
	},
	{
		title:
			"Tokens per Kilowatt-Hour: The Hidden Energy Bill Behind the AI Boom",
		slug: "ai-data-center-energy-demand-2026",
		excerpt:
			"Chatbots feel weightless; substations do not. Training spikes and inference forever are reshaping grid forecasts, water use, and the politics of who pays for new transmission. A full tour of the load—and the levers that actually matter.",
		tags: ["artificial-intelligence", "energy", "technology"],
		metaTitle: "AI & data-center electricity: the 2026 grid story",
		metaDescription:
			"Long read: AI power demand, PUE and cooling, PPAs, interconnection queues, chip vs datacenter energy, and primary sources.",
		keywords: ["AI energy", "data centers", "electricity demand", "efficiency"],
	},
	{
		title:
			"Grey Skies Return: South Asia’s Smog Season, Crop Residue, and the Politics of Breathable Air",
		slug: "south-asia-smog-season-air-quality-2026",
		excerpt:
			"When the AQI app turns maroon, the same blame game returns: farmers, trucks, kilns, power plants. The chemistry is real; the solutions are slow. Here is a systems-level read—with health evidence, cross-border dynamics, and references worth bookmarking.",
		tags: ["health", "environment", "south-asia"],
		metaTitle: "South Asia smog season: causes, policy, references",
		metaDescription:
			"Long read: PM2.5, stubble burning, transport and industry, indoor air, satellites, and WHO-backed context.",
		keywords: ["smog", "AQI", "air pollution", "South Asia", "health"],
	},
];

async function main() {
	const databaseUrl = process.env.DATABASE_URL;
	const authorId =
		process.env.BLOG_SEED_AUTHOR_ID ||
		process.env.BLOG_AUTHOR_ID ||
		"4ddb33c2-7d36-4650-b83b-b7648401d28b";

	const doUpdate =
		process.argv.includes("--update") || process.env.BLOG_SEED_UPDATE === "1";

	if (!databaseUrl) {
		console.error("Missing DATABASE_URL in environment.");
		process.exit(1);
	}

	const sql = neon(databaseUrl);
	const db = drizzle({ client: sql, schema });

	let inserted = 0;
	let skipped = 0;
	let updated = 0;

	for (const blog of SEED_BLOGS) {
		const content = loadMarkdown(blog.slug);

		const existing = await db
			.select({ id: schema.blogs.id })
			.from(schema.blogs)
			.where(eq(schema.blogs.slug, blog.slug))
			.limit(1);

		if (existing.length > 0) {
			if (doUpdate) {
				await db
					.update(schema.blogs)
					.set({
						title: blog.title,
						content,
						excerpt: blog.excerpt,
						tags: blog.tags,
						metaTitle: blog.metaTitle,
						metaDescription: blog.metaDescription,
						keywords: blog.keywords,
						updatedAt: new Date(),
					})
					.where(eq(schema.blogs.slug, blog.slug));
				console.log(`Updated: ${blog.slug}`);
				updated++;
			} else {
				console.log(`Skip (exists): ${blog.slug}`);
				skipped++;
			}
			continue;
		}

		await db.insert(schema.blogs).values({
			id: crypto.randomUUID(),
			title: blog.title,
			slug: blog.slug,
			content,
			excerpt: blog.excerpt,
			coverImage: null,
			authorId,
			isPublished: true,
			tags: blog.tags,
			metaTitle: blog.metaTitle,
			metaDescription: blog.metaDescription,
			keywords: blog.keywords,
			commentsCount: 0,
			viewCount: 0,
		});

		console.log(`Inserted: ${blog.title}`);
		inserted++;
	}

	console.log(
		`Done. Inserted ${inserted}, updated ${updated}, skipped ${skipped}.`,
	);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
