export const PERMISSIONS = {
	SEE_STATS: "canSeeStats",
	MANAGE_BLOGS: "canManageBlogs",
	MANAGE_COMMENTS: "canManageComments",
	MANAGE_PAGES: "canManagePages",
	MANAGE_USERS: "canManageUsers",
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];
