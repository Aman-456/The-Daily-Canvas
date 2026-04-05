"use server";

import { db } from "@/db/index";
import { newsletterSubscribers } from "@/db/schema";
import { desc, like, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const getCachedNewsletterSubscribers = unstable_cache(
	async (search: string, skip: number, limit: number) => {
		let dbQuery = db.select().from(newsletterSubscribers);
		let countQuery = db
			.select({ count: sql<number>`count(*)` })
			.from(newsletterSubscribers);

		if (search.trim()) {
			const searchCondition = like(
				newsletterSubscribers.email,
				`%${search.trim()}%`,
			);
			dbQuery = dbQuery.where(searchCondition) as typeof dbQuery;
			countQuery = countQuery.where(searchCondition) as typeof countQuery;
		}

		const [rows, countRows] = await Promise.all([
			dbQuery
				.orderBy(desc(newsletterSubscribers.createdAt))
				.limit(limit)
				.offset(skip),
			countQuery,
		]);

		const total = Number(countRows[0]?.count ?? 0);
		return [rows, total] as const;
	},
	["admin-newsletter-subscribers"],
	{ revalidate: 300, tags: ["newsletter-subscribers"] },
);
