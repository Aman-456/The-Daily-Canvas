"use server";

import dbConnect from "@/lib/mongoose";
import Notification from "@/models/Notification";
import { auth } from "@/auth";
import { isAdminOrSubAdmin } from "@/lib/utils";

export async function getNotifications(limit = 20) {
	try {
		const session = await auth();
		if (!session?.user || !isAdminOrSubAdmin(session.user.role)) {
			return { success: false, error: "Unauthorized" };
		}

		await dbConnect();
		const notifications = await Notification.find({})
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
		if (!session?.user || !isAdminOrSubAdmin(session.user.role)) {
			return { success: false, error: "Unauthorized" };
		}

		await dbConnect();
		await Notification.findByIdAndUpdate(id, { isRead: true });

		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function markAllNotificationsAsRead() {
    try {
		const session = await auth();
		if (!session?.user || !isAdminOrSubAdmin(session.user.role)) {
			return { success: false, error: "Unauthorized" };
		}

		await dbConnect();
		await Notification.updateMany({ isRead: false }, { isRead: true });

		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}
