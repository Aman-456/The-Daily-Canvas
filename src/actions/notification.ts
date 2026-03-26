"use server";

import { db } from "@/db/index";
import { notifications } from "@/db/schema";
import { auth } from "@/auth";
import { eq, or, inArray, and, desc, asc } from "drizzle-orm";

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

export async function markNotificationAsRead(id: string) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, error: "Unauthorized" };
		}

		await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));

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

			const conditions = [];
			conditions.push(eq(notifications.targetAuthorId, userId));
			if (allowedTypes.length > 0) {
				conditions.push(inArray(notifications.type, allowedTypes));
			}

			await db.update(notifications)
				.set({ isRead: true })
				.where(and(eq(notifications.isRead, false), or(...conditions)));
		}

		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}
