"use server";

import { checkPermission, PERMISSIONS } from "@/lib/permissions";
import { getModerationQueue, type ModerationQueueType } from "@/queries/moderation";
import { db } from "@/db/index";
import { articleReports, commentReports } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

export async function getModerationQueueAction(params: {
	type: ModerationQueueType;
	status?: "open" | "resolved" | "all";
	page: number;
	limit: number;
}) {
	const { authorized } = await checkPermission(PERMISSIONS.MANAGE_COMMENTS);
	if (!authorized) return { success: false, error: "Unauthorized" };
	const data = await getModerationQueue(params);
	return { success: true, data };
}

export async function resolveReports(params: {
	type: ModerationQueueType;
	targetId: string;
	resolution?: "resolved";
}) {
	const { authorized } = await checkPermission(PERMISSIONS.MANAGE_COMMENTS);
	if (!authorized) return { success: false, error: "Unauthorized" };

	if (params.type === "articles") {
		await db
			.update(articleReports)
			.set({ status: "resolved", updatedAt: new Date() })
			.where(and(eq(articleReports.blogId, params.targetId), eq(articleReports.status, "open")));
		revalidateTag("blogs", "max");
	} else {
		await db
			.update(commentReports)
			.set({ status: "resolved", updatedAt: new Date() })
			.where(
				and(
					eq(commentReports.commentId, params.targetId),
					eq(commentReports.status, "open"),
				),
			);
		revalidateTag("comments", "max");
	}

	revalidatePath("/admin/moderation");
	return { success: true };
}

