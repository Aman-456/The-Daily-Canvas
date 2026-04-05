"use server";

import { db } from "@/db/index";
import { users } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAdmin } from "@/lib/utils";
import { unstable_cache } from "next/cache";
import { eq, like, or, desc, sql } from "drizzle-orm";

export const getCachedUsers = unstable_cache(
	async (search: string, skip: number, limit: number) => {
		let dbQuery = db.select().from(users);
		let countQuery = db.select({ count: sql<number>`count(*)` }).from(users);

		if (search) {
			const searchCondition = or(
				like(users.name, `%${search}%`),
				like(users.email, `%${search}%`)
			);
			dbQuery = dbQuery.where(searchCondition) as any;
			countQuery = countQuery.where(searchCondition) as any;
		}

		const [userResults, userCount] = await Promise.all([
			dbQuery.orderBy(desc(users.createdAt)).limit(limit).offset(skip),
			countQuery,
		]);

		return [userResults, userCount[0].count];
	},
	["admin-users-list"],
	{ revalidate: 86400, tags: ["users"] }
);

export async function toggleUserRole(
	userId: string,
	newRole: "USER" | "ADMIN",
) {
	try {
		const session = await auth();

		if (!session?.user || !isAdmin(session.user.role)) {
			return {
				success: false,
				error: "Unauthorized: Only Admins can change user roles",
			};
		}

		// Prevent admin from demoting themselves if they are the last admin
		if (userId === session.user.id && newRole !== "ADMIN") {
			return { success: false, error: "Cannot demote yourself" };
		}

		await db.update(users).set({ role: newRole }).where(eq(users.id, userId));

		revalidatePath("/admin/users");

		return { success: true };
	} catch (error: any) {
		console.error("[toggleUserRole] Error:", error);
		return {
			success: false,
			error: error.message || "An unexpected error occurred",
		};
	}
}

export async function updateUserProfile(formData: FormData) {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Unauthorized" };

		const name = formData.get("name") as string;

		await db.update(users).set({ name }).where(eq(users.id, session.user.id));

		revalidatePath("/admin");

		return { success: true };
	} catch (error: any) {
		console.error("[updateUserProfile] Error:", error);
		return {
			success: false,
			error: error.message || "An unexpected error occurred",
		};
	}
}

export async function deleteUser(userId: string) {
	try {
		const session = await auth();

		if (!session?.user || !isAdmin(session.user.role)) {
			return {
				success: false,
				error: "Unauthorized: Only Admins can delete users",
			};
		}

		if (userId === session.user.id) {
			return { success: false, error: "Cannot delete yourself" };
		}

		await db.delete(users).where(eq(users.id, userId));

		revalidatePath("/admin/users");
		revalidateTag("users", "max");
		revalidateTag("stats", "max");

		return { success: true };
	} catch (error: any) {
		console.error("[deleteUser] Error:", error);
		return {
			success: false,
			error: error.message || "An unexpected error occurred",
		};
	}
}
