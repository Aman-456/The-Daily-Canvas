"use server";

import { auth } from "@/auth";
import { db } from "@/db/index";
import {
	articleReports,
	commentReports,
	blogs,
	comments,
} from "@/db/schema";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { checkPermission, PERMISSIONS } from "@/lib/permissions";
import { getAnyAdminUserId, insertAdminOnlyNotification } from "@/lib/notify-admins";

const AUTO_HIDE_THRESHOLD = 5;

function parseReportText(v: FormDataEntryValue | null): string {
	return typeof v === "string" ? v.trim() : "";
}

export async function reportArticle(formData: FormData) {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Unauthorized" };

		const blogId = parseReportText(formData.get("blogId"));
		const slug = parseReportText(formData.get("slug"));
		const reason = parseReportText(formData.get("reason")) || "other";
		const details = parseReportText(formData.get("details")) || null;

		if (!blogId) return { success: false, error: "Missing blogId" };

		const [blogRow] = await db
			.select({ authorId: blogs.authorId })
			.from(blogs)
			.where(eq(blogs.id, blogId))
			.limit(1);
		if (!blogRow) return { success: false, error: "Article not found" };
		if (blogRow.authorId === session.user.id) {
			return { success: false, error: "You cannot report your own article" };
		}

		// Insert if not already reported by this user.
		try {
			await db.insert(articleReports).values({
				blogId,
				reporterUserId: session.user.id,
				reason,
				details,
			});
		} catch (e: any) {
			// Ignore unique violations (already reported).
			const msg = String(e?.message || "");
			if (!msg.toLowerCase().includes("unique") && !msg.toLowerCase().includes("duplicate")) {
				throw e;
			}
		}

		const [countRow] = await db
			.select({ n: count() })
			.from(articleReports)
			.where(and(eq(articleReports.blogId, blogId), eq(articleReports.status, "open")));

		const reportsCount = Number(countRow?.n ?? 0);

		let hidden = false;
		if (reportsCount >= AUTO_HIDE_THRESHOLD) {
			await db.update(blogs).set({ isHidden: true, updatedAt: new Date() }).where(eq(blogs.id, blogId));
			hidden = true;
		}

		// Admin notification (best-effort).
		try {
			const adminId = await getAnyAdminUserId();
			if (adminId) {
				await insertAdminOnlyNotification({
					type: "CONTACT_FORM",
					message: `Article reported (${reason}).`,
					link: "/admin/moderation",
					blogLink: slug ? `/articles/${slug}` : "/admin/moderation",
					userIdForFk: adminId,
				});
			}
		} catch (err) {
			console.error("[reportArticle] admin notification:", err);
		}

		if (slug) revalidatePath(`/articles/${slug}`);
		revalidateTag("blogs", "max");

		return { success: true, data: { hidden, reportsCount } };
	} catch (error: any) {
		console.error("[reportArticle] Error:", error);
		return { success: false, error: error.message || "An unexpected error occurred" };
	}
}

export async function reportComment(formData: FormData) {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Unauthorized" };

		const commentId = parseReportText(formData.get("commentId"));
		const slug = parseReportText(formData.get("slug"));
		const reason = parseReportText(formData.get("reason")) || "other";
		const details = parseReportText(formData.get("details")) || null;

		if (!commentId) return { success: false, error: "Missing commentId" };

		const [commentRow] = await db
			.select({ userId: comments.userId })
			.from(comments)
			.where(eq(comments.id, commentId))
			.limit(1);
		if (!commentRow) return { success: false, error: "Comment not found" };
		if (commentRow.userId === session.user.id) {
			return { success: false, error: "You cannot report your own comment" };
		}

		try {
			await db.insert(commentReports).values({
				commentId,
				reporterUserId: session.user.id,
				reason,
				details,
			});
		} catch (e: any) {
			const msg = String(e?.message || "");
			if (!msg.toLowerCase().includes("unique") && !msg.toLowerCase().includes("duplicate")) {
				throw e;
			}
		}

		const [countRow] = await db
			.select({ n: count() })
			.from(commentReports)
			.where(and(eq(commentReports.commentId, commentId), eq(commentReports.status, "open")));

		const reportsCount = Number(countRow?.n ?? 0);

		let hidden = false;
		if (reportsCount >= AUTO_HIDE_THRESHOLD) {
			await db.update(comments).set({ isHidden: true, updatedAt: new Date() }).where(eq(comments.id, commentId));
			hidden = true;
		}

		try {
			const adminId = await getAnyAdminUserId();
			if (adminId) {
				await insertAdminOnlyNotification({
					type: "CONTACT_FORM",
					message: `Comment reported (${reason}).`,
					link: "/admin/moderation",
					blogLink: slug ? `/articles/${slug}#comments` : "/admin/moderation",
					userIdForFk: adminId,
				});
			}
		} catch (err) {
			console.error("[reportComment] admin notification:", err);
		}

		if (slug) revalidatePath(`/articles/${slug}`);
		revalidateTag("comments", "max");

		return { success: true, data: { hidden, reportsCount } };
	} catch (error: any) {
		console.error("[reportComment] Error:", error);
		return { success: false, error: error.message || "An unexpected error occurred" };
	}
}

export async function setArticleHidden(params: { blogId: string; hidden: boolean }) {
	const { authorized } = await checkPermission(PERMISSIONS.MANAGE_BLOGS);
	if (!authorized) return { success: false, error: "Unauthorized" };
	await db.update(blogs).set({ isHidden: params.hidden, updatedAt: new Date() }).where(eq(blogs.id, params.blogId));
	revalidateTag("blogs", "max");
	return { success: true };
}

export async function setCommentHidden(params: { commentId: string; hidden: boolean }) {
	const { authorized } = await checkPermission(PERMISSIONS.MANAGE_COMMENTS);
	if (!authorized) return { success: false, error: "Unauthorized" };
	await db.update(comments).set({ isHidden: params.hidden, updatedAt: new Date() }).where(eq(comments.id, params.commentId));
	revalidateTag("comments", "max");
	return { success: true };
}

