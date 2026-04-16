"use server";

import { db } from "@/db/index";
import { users } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAdmin } from "@/lib/utils";
import { unstable_cache } from "next/cache";
import { and, count, eq, like, or, desc, asc, sql } from "drizzle-orm";

export const getCachedUsers = unstable_cache(
	async (
		search: string,
		skip: number,
		limit: number,
		status: "all" | "active" | "disabled" = "all",
		sort: "joined_desc" | "joined_asc" | "name_asc" | "email_asc" = "joined_desc",
	) => {
		let dbQuery = db.select().from(users);
		let countQuery = db.select({ count: sql<number>`count(*)` }).from(users);

		const conditions: any[] = [];
		if (search) {
			const searchCondition = or(
				like(users.name, `%${search}%`),
				like(users.email, `%${search}%`)
			);
			conditions.push(searchCondition);
		}

		if (status === "active") conditions.push(eq(users.isDisabled, false));
		if (status === "disabled") conditions.push(eq(users.isDisabled, true));

		const where = conditions.length ? and(...conditions) : undefined;
		if (where) {
			dbQuery = dbQuery.where(where) as any;
			countQuery = countQuery.where(where) as any;
		}

		const orderBy =
			sort === "joined_asc"
				? asc(users.createdAt)
				: sort === "name_asc"
					? asc(users.name)
					: sort === "email_asc"
						? asc(users.email)
						: desc(users.createdAt);

		const [userResults, userCount] = await Promise.all([
			dbQuery.orderBy(orderBy).limit(limit).offset(skip),
			countQuery,
		]);

		return [userResults, userCount[0].count];
	},
	["admin-users-list"],
	{ revalidate: 86400, tags: ["users"] }
);

export async function toggleUserDisabled(userId: string) {
	try {
		const session = await auth();

		if (!session?.user || !isAdmin(session.user.role)) {
			return { success: false, error: "Unauthorized: Only Admins can disable users" };
		}

		if (userId === session.user.id) {
			return { success: false, error: "Cannot disable yourself" };
		}

		const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
		const u = existing[0];
		if (!u) return { success: false, error: "User not found" };

		await db
			.update(users)
			.set({ isDisabled: !u.isDisabled, updatedAt: new Date() })
			.where(eq(users.id, userId));

		revalidatePath("/admin/users");
		revalidateTag("users", "max");

		return { success: true };
	} catch (error: any) {
		console.error("[toggleUserDisabled] Error:", error);
		return { success: false, error: error.message || "An unexpected error occurred" };
	}
}

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

		const target = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});
		if (!target) {
			return { success: false, error: "User not found" };
		}

		if (newRole === "USER" && target.role === "ADMIN") {
			const [row] = await db
				.select({ n: count() })
				.from(users)
				.where(eq(users.role, "ADMIN"));
			if (Number(row?.n ?? 0) <= 1) {
				return {
					success: false,
					error: "Cannot demote the last administrator",
				};
			}
		}

		await db.update(users).set({ role: newRole }).where(eq(users.id, userId));

		revalidatePath("/admin/users");
		revalidateTag("users", "max");

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

		const rawName = (formData.get("name") as string | null) ?? "";
		const rawUsername = (formData.get("username") as string | null) ?? "";
		const rawBio = (formData.get("bio") as string | null) ?? "";

		const name = rawName.trim() || null;
		const bio = rawBio.trim() ? rawBio.trim().slice(0, 800) : null;

		const normalizeUsername = (input: string) =>
			input
				.trim()
				.toLowerCase()
				.replace(/['"]/g, "")
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "")
				.replace(/--+/g, "-");

		const desiredUsername = rawUsername.trim()
			? normalizeUsername(rawUsername).slice(0, 32)
			: "";

		if (desiredUsername && (desiredUsername.length < 3 || desiredUsername.length > 32)) {
			return {
				success: false,
				error: "Username must be 3–32 characters.",
			};
		}
		if (desiredUsername && !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(desiredUsername)) {
			return {
				success: false,
				error: "Username may include lowercase letters, numbers, and dashes.",
			};
		}

		const existing = await db.query.users.findFirst({
			where: eq(users.id, session.user.id),
		});
		if (!existing) return { success: false, error: "User not found" };

		// Policy: usernames are locked after first set.
		if (existing.username && desiredUsername && existing.username !== desiredUsername) {
			return {
				success: false,
				error: "Username is already set and cannot be changed.",
			};
		}

		if (!existing.username && desiredUsername) {
			const conflict = await db.query.users.findFirst({
				where: and(eq(users.username, desiredUsername), sql`${users.id} <> ${session.user.id}`),
			});
			if (conflict) {
				return { success: false, error: "That username is already taken." };
			}
		}

		await db
			.update(users)
			.set({
				...(name !== null ? { name } : {}),
				...(bio !== null ? { bio } : {}),
				...(!existing.username && desiredUsername ? { username: desiredUsername } : {}),
				updatedAt: new Date(),
			})
			.where(eq(users.id, session.user.id));

		revalidatePath("/admin/profile");
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
