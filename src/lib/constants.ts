export const PERMISSIONS = {
	SEE_STATS: "canSeeStats",
	MANAGE_BLOGS: "canManageBlogs",
	MANAGE_COMMENTS: "canManageComments",
	MANAGE_PAGES: "canManagePages",
	MANAGE_USERS: "canManageUsers",
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Permission flag map persisted on `users.permissions` and mirrored onto the
 * session user (see `src/types/next-auth.d.ts` and `src/auth.ts`).
 *
 * Keep this type as the single source of truth — updating it will flow through
 * to server actions, queries, and `hasPermission()`.
 */
export type UserPermissions = Record<PermissionKey, boolean>;
