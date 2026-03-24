"use server";

import dbConnect from "@/lib/mongoose";
import Page from "@/models/Page";
import { revalidatePath, unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/utils";

const getCachedAdminPages = unstable_cache(
	async () => {
		await dbConnect();
		// Ensure both pages exist inside the cached fetcher
		const slugs = ["privacy-policy", "terms-of-service"];
		for (const slug of slugs) {
			const exists = await Page.findOne({ slug }).lean();
			if (!exists) {
				const title = slug === "privacy-policy" ? "Privacy Policy" : "Terms of Service";
				const content = `<h1>${title}</h1><p>This is the default content for the ${title}. Please edit this page from the admin panel.</p>`;
				await Page.create({ title, slug, content });
			}
		}
		return Page.find().sort({ createdAt: -1 }).lean();
	},
	["admin-pages-list-full"],
	{ revalidate: 86400, tags: ["pages"] }
);

const getCachedPageBySlug = unstable_cache(
	async (slug: string) => {
		await dbConnect();
		return Page.findOne({ slug }).lean();
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

			const newPage = await Page.create({
				title,
				slug,
				content,
			});
			page = JSON.parse(JSON.stringify(newPage));
		} else {
			page = JSON.parse(JSON.stringify(page));
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

		const pages = await getCachedAdminPages();
		return { success: true, data: JSON.parse(JSON.stringify(pages)) };
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

		await dbConnect();
		const updateData: any = { content };
		if (title) updateData.title = title;

		const updatedPage = await Page.findOneAndUpdate(
			{ slug },
			updateData,
			{ new: true }
		).lean();

		if (!updatedPage) {
			return { success: false, error: "Page not found" };
		}

		revalidatePath(`/${slug}`);

		return { success: true, data: JSON.parse(JSON.stringify(updatedPage)) };
	} catch (error: any) {
		console.error("[updateAdminPage] Error:", error);
		return { success: false, error: error.message };
	}
}
