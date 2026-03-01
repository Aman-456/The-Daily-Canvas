"use server";

import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function toggleUserRole(
	userId: string,
	newRole: "USER" | "ADMIN" | "SUBADMIN",
) {
	const session = await auth();

	// Only ADMIN can change roles
	if (session?.user?.role !== "ADMIN") {
		throw new Error("Unauthorized: Only Admins can change user roles");
	}

	// Prevent admin from demoting themselves if they are the last admin
	// (Simplified for this project)
	if (userId === session.user.id && newRole !== "ADMIN") {
		throw new Error("Cannot demote yourself");
	}

	await dbConnect();
	await User.findByIdAndUpdate(userId, { role: newRole });

	revalidatePath("/admin/users");

	return { success: true };
}

export async function updateUserProfile(formData: FormData) {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");

	const name = formData.get("name") as string;

	await dbConnect();
	await User.findByIdAndUpdate(session.user.id, { name });

	revalidatePath("/admin");

	return { success: true };
}
