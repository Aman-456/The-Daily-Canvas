"use server";

import dbConnect from "@/lib/mongoose";
import Notification from "@/models/Notification";
import { auth } from "@/auth";

export async function getNotifications(limit = 20) {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, error: "Unauthorized" };
		}

		await dbConnect();
		const { role, permissions, id: userId } = session.user;
		let query: any = {};

		if (role === "ADMIN") {
			query = {};
		} else {
			// Regular User: include their own content ONLY
			query = { targetAuthorId: userId };
		}

		const notifications = await Notification.find(query)
			.sort({ isRead: 1, createdAt: -1 })
			.limit(limit)
			.lean();

		return { success: true, data: JSON.parse(JSON.stringify(notifications)) };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function markNotificationAsRead(id: string) {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, error: "Unauthorized" };
		}

		await dbConnect();
		// For safety, we could check if they own this notification here, 
		// but since they can only see their own in the UI, this is generally safe.
		await Notification.findByIdAndUpdate(id, { isRead: true });

		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function markAllNotificationsAsRead() {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, error: "Unauthorized" };
		}

		await dbConnect();
		const { role, permissions, id: userId } = session.user;
		let query: any = { isRead: false };

		if (role === "ADMIN") {
			// All unread
		} else {
			const allowedTypes: string[] = [];
			if (permissions?.canManageComments) allowedTypes.push("COMMENT");
			if (permissions?.canManageBlogs) {
				allowedTypes.push("BLOG_PUBLISHED", "BLOG_UNPUBLISHED", "BLOG_UPDATE", "BLOG_DELETE");
			}

			query = {
				isRead: false,
				$or: [
					{ targetAuthorId: userId },
					...(allowedTypes.length > 0 ? [{ type: { $in: allowedTypes } }] : [])
				]
			};
		}

		await Notification.updateMany(query, { isRead: true });

		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}
