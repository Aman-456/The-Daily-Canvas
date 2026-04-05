import { db } from "@/db/index";
import { users, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getAnyAdminUserId(): Promise<string | null> {
	const row = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.role, "ADMIN"))
		.limit(1);
	return row[0]?.id ?? null;
}

/** Admin-only rows: `targetAuthorId` null so non-admins never see them in filtered queries. */
export async function insertAdminOnlyNotification(params: {
	type: "NEWSLETTER_SUBSCRIBE" | "USER_SIGNUP" | "CONTACT_FORM";
	message: string;
	link: string;
	blogLink: string;
	/** Must satisfy `notification.userId` FK — new user id for signups, any admin id for newsletter. */
	userIdForFk: string;
}) {
	await db.insert(notifications).values({
		message: params.message,
		link: params.link,
		blogLink: params.blogLink,
		type: params.type,
		userId: params.userIdForFk,
		targetAuthorId: null,
		isRead: false,
	});
}
