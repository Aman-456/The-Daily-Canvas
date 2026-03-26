"use server";

import { db } from "@/db/index";
import { pages } from "@/db/schema";
import { revalidatePath, unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/utils";
import { eq, desc } from "drizzle-orm";

const getCachedAdminPages = unstable_cache(
	async () => {
		const slugs = ["privacy-policy", "terms-of-service"];
		for (const slug of slugs) {
			const existingPages = await db.select().from(pages).where(eq(pages.slug, slug));
			if (existingPages.length === 0) {
				const title = slug === "privacy-policy" ? "Privacy Policy" : "Terms of Service";
				const content = `<h1>${title}</h1><p>This is the default content for the ${title}. Please edit this page from the admin panel.</p>`;
				await db.insert(pages).values({ title, slug, content });
			}
		}
		return db.select().from(pages).orderBy(desc(pages.createdAt));
	},
	["admin-pages-list-full"],
	{ revalidate: 86400, tags: ["pages"] }
);

const getCachedPageBySlug = unstable_cache(
	async (slug: string) => {
		const result = await db.select().from(pages).where(eq(pages.slug, slug));
		return result[0] || null;
	},
	["page-by-slug"],
	{ revalidate: 86400, tags: ["pages"] }
);

export async function getPageBySlug(slug: string) {
	try {
		let page = await getCachedPageBySlug(slug);

		if (!page) {
			// Auto-generate initial data if none exists
			const title = slug === "privacy-policy" ? "Privacy Policy" : "Terms of Service";
			const content = `<h1>${title}</h1><p>This is the default content for the ${title}. Please edit this page from the admin panel.</p>`;

			const newPageResult = await db.insert(pages).values({
				title,
				slug,
				content,
			}).returning();
			page = newPageResult[0];
		} 

		return { success: true, data: page };
	} catch (error: any) {
		console.error("[getPageBySlug] Error:", error);
		return { success: false, error: error.message };
	}
}

export async function getAdminPages() {
	try {
		const session = await auth();
		if (!session?.user || !hasPermission(session.user, "canManagePages")) {
			return { success: false, error: "Unauthorized" };
		}

		const adminPages = await getCachedAdminPages();
		return { success: true, data: adminPages };
	} catch (error: any) {
		console.error("[getAdminPages] Error:", error);
		return { success: false, error: error.message };
	}
}

export async function updateAdminPage(slug: string, content: string, title?: string) {
	try {
		const session = await auth();
		if (!session?.user || !hasPermission(session.user, "canManagePages")) {
			return { success: false, error: "Unauthorized" };
		}

		const updateData: any = { content, updatedAt: new Date() };
		if (title) updateData.title = title;

		const updatedPages = await db.update(pages)
			.set(updateData)
			.where(eq(pages.slug, slug))
			.returning();

		if (updatedPages.length === 0) {
			return { success: false, error: "Page not found" };
		}

		revalidatePath(`/${slug}`);

		return { success: true, data: updatedPages[0] };
	} catch (error: any) {
		console.error("[updateAdminPage] Error:", error);
		return { success: false, error: error.message };
	}
}
