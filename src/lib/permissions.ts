import { PERMISSIONS, type PermissionKey } from "./constants";
export { PERMISSIONS };
export type { PermissionKey };
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAdmin, hasPermission } from "./utils";

/**
 * Checks if the current user has the required permission or is an admin.
 * Returns the session and authorization status.
 */
export async function checkPermission(permission: PermissionKey) {
	const session = await auth();
	const user = session?.user;

	const authorized = isAdmin(user?.role) || hasPermission(user, permission);

	return { session, authorized };
}

/**
 * Ensures the current user has the required permission or is an admin.
 * If not, redirects to the home page (or specified path).
 * Returns the session if authorized.
 */
export async function ensurePermission(permission: PermissionKey, redirectTo = "/") {
	const { session, authorized } = await checkPermission(permission);

	if (!authorized) {
		redirect(redirectTo);
	}

	return session;
}
