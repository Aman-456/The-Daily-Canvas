"use server";

import { db } from "@/db/index";
import { notifications } from "@/db/schema";
import { auth } from "@/auth";
import { eq, inArray, and, desc, asc, sql } from "drizzle-orm";

export async function getNotifications(limit = 20) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, error: "Unauthorized" };
		}

		const { role, id: userId } = session.user;
		let dbQuery = db.select().from(notifications);

		if (role !== "ADMIN") {
			// Regular User: include their own content ONLY
			dbQuery = dbQuery.where(eq(notifications.targetAuthorId, userId)) as any;
		}

		const result = await dbQuery
			.orderBy(asc(notifications.isRead), desc(notifications.createdAt))
			.limit(limit);

		return { success: true, data: result };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function getUnreadNotificationsCount() {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, error: "Unauthorized" as const };
		}

		const { role, id: userId } = session.user;
		const whereClause =
			role === "ADMIN"
				? eq(notifications.isRead, false)
				: and(eq(notifications.isRead, false), eq(notifications.targetAuthorId, userId));

		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(notifications)
			.where(whereClause);

		return { success: true, data: Number(result[0]?.count ?? 0) };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function markNotificationAsRead(id: string) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, error: "Unauthorized" };
		}

		const { role, id: userId } = session.user;

		const whereClause =
			role === "ADMIN"
				? eq(notifications.id, id)
				: and(eq(notifications.id, id), eq(notifications.targetAuthorId, userId));

		const updated = await db
			.update(notifications)
			.set({ isRead: true })
			.where(whereClause)
			.returning({ id: notifications.id });

		if (updated.length === 0) {
			return { success: false, error: "Not found" };
		}

		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function markAllNotificationsAsRead() {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, error: "Unauthorized" };
		}

		const { role, permissions, id: userId } = session.user;

		if (role === "ADMIN") {
			await db.update(notifications).set({ isRead: true }).where(eq(notifications.isRead, false));
		} else {
			const allowedTypes: any[] = [];
			if ((permissions as any)?.canManageComments) allowedTypes.push("COMMENT");
			if ((permissions as any)?.canManageBlogs) {
				allowedTypes.push("BLOG_PUBLISHED", "BLOG_UNPUBLISHED", "BLOG_UPDATE", "BLOG_DELETE");
			}

			const whereClause =
				allowedTypes.length > 0
					? and(
							eq(notifications.isRead, false),
							eq(notifications.targetAuthorId, userId),
							inArray(notifications.type, allowedTypes),
						)
					: and(
							eq(notifications.isRead, false),
							eq(notifications.targetAuthorId, userId),
						);

			await db.update(notifications).set({ isRead: true }).where(whereClause);
		}

		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}
