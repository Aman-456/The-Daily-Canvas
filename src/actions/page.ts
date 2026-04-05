"use server";

import { db } from "@/db/index";
import { pages } from "@/db/schema";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { after } from "next/server";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/utils";
import { eq, inArray } from "drizzle-orm";
import {
	CMS_MANAGED_PAGE_SLUGS,
	type CmsManagedPageSlug,
	cmsPageCacheTag,
	defaultCmsPage,
} from "@/lib/cms-pages";

const getCachedAdminPages = unstable_cache(
	async () => {
		for (const slug of CMS_MANAGED_PAGE_SLUGS) {
			const existingPages = await db.select().from(pages).where(eq(pages.slug, slug));
			if (existingPages.length === 0) {
				const def = defaultCmsPage(slug);
				if (def) {
					await db.insert(pages).values({ title: def.title, slug, content: def.content });
				}
			}
		}
		const managedSlugs = [...CMS_MANAGED_PAGE_SLUGS] as string[];
		const rows = await db
			.select()
			.from(pages)
			.where(inArray(pages.slug, managedSlugs));
		const order = (s: string) =>
			CMS_MANAGED_PAGE_SLUGS.indexOf(s as CmsManagedPageSlug);
		return [...rows].sort((a, b) => order(a.slug) - order(b.slug));
	},
	["admin-pages-list-full"],
	{ revalidate: 86400, tags: ["pages"] },
);

const getCachedPageBySlug = unstable_cache(
	async (slug: string) => {
		const result = await db.select().from(pages).where(eq(pages.slug, slug));
		return result[0] || null;
	},
	["page-by-slug"],
	{ revalidate: 86400, tags: ["pages"] },
);

export async function getPageBySlug(slug: string) {
	try {
		let page = await getCachedPageBySlug(slug);

		if (!page) {
			const def = defaultCmsPage(slug);
			if (!def) {
				return { success: false, error: "Page not found" };
			}

			const newPageResult = await db
				.insert(pages)
				.values({
					title: def.title,
					slug,
					content: def.content,
				})
				.returning();
			page = newPageResult[0];
			after(() => {
				revalidateTag("pages", "max");
				const insertedTag = cmsPageCacheTag(slug);
				if (insertedTag) {
					revalidateTag(insertedTag, "max");
				}
			});
		}

		return { success: true, data: page };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("[getPageBySlug] Error:", error);
		return { success: false, error: message };
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
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("[getAdminPages] Error:", error);
		return { success: false, error: message };
	}
}

export async function updateAdminPage(slug: string, content: string, title?: string) {
	try {
		const session = await auth();
		if (!session?.user || !hasPermission(session.user, "canManagePages")) {
			return { success: false, error: "Unauthorized" };
		}

		const allowedSlugs = new Set<string>(CMS_MANAGED_PAGE_SLUGS);
		if (!allowedSlugs.has(slug)) {
			return { success: false, error: "Page not found" };
		}

		const updateData: { content: string; updatedAt: Date; title?: string } = {
			content,
			updatedAt: new Date(),
		};
		if (title) updateData.title = title;

		const updatedPages = await db
			.update(pages)
			.set(updateData)
			.where(eq(pages.slug, slug))
			.returning();

		if (updatedPages.length === 0) {
			return { success: false, error: "Page not found" };
		}

		revalidatePath(`/${slug}`);
		revalidatePath("/admin/pages");
		revalidateTag("pages", "max");
		const pageTag = cmsPageCacheTag(slug);
		if (pageTag) {
			revalidateTag(pageTag, "max");
		}

		return { success: true, data: updatedPages[0] };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("[updateAdminPage] Error:", error);
		return { success: false, error: message };
	}
}
