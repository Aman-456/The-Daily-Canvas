"use server";

import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/utils";
import { unstable_cache } from "next/cache";

export const getCachedUsers = unstable_cache(
	async (query: any, skip: number, limit: number) => {
		await dbConnect();
		return Promise.all([
			User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
			User.countDocuments(query),
		]);
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
		// (Simplified for this project)
		if (userId === session.user.id && newRole !== "ADMIN") {
			return { success: false, error: "Cannot demote yourself" };
		}

		await dbConnect();
		await User.findByIdAndUpdate(userId, { role: newRole });

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

		await dbConnect();
		await User.findByIdAndUpdate(session.user.id, { name });

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

		await dbConnect();
		await User.findByIdAndDelete(userId);

		revalidatePath("/admin/users");

		return { success: true };
	} catch (error: any) {
		console.error("[deleteUser] Error:", error);
		return {
			success: false,
			error: error.message || "An unexpected error occurred",
		};
	}
}

