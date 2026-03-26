"use server";

import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function updateUserPermissions(
	userId: string,
	permissions: {
		canSeeStats: boolean;
		canManageBlogs: boolean;
		canManageComments: boolean;
		canManagePages: boolean;
		canManageUsers: boolean;
	},
) {
	try {
		const session = await auth();

		if (!session?.user || !isAdmin(session.user.role)) {
			return {
				success: false,
				error: "Unauthorized: Only Admins can change permissions",
			};
		}

		await db.update(users).set({ permissions }).where(eq(users.id, userId));

		revalidatePath("/admin/users");

		return { success: true };
	} catch (error: any) {
		console.error("[updateUserPermissions] Error:", error);
		return {
			success: false,
			error: error.message || "An unexpected error occurred",
		};
	}
}
