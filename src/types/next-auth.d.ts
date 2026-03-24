import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
	/**
	 * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
	 */
	interface Session {
		user: {
			/** The user's role. */
			role?: string;
			permissions?: {
				canSeeStats: boolean;
				canManageBlogs: boolean;
				canManageComments: boolean;
				canManagePages: boolean;
				canManageUsers: boolean;
			};
		} & DefaultSession["user"];
	}

	interface User {
		role?: string;
		permissions?: {
			canSeeStats: boolean;
			canManageBlogs: boolean;
			canManageComments: boolean;
			canManagePages: boolean;
			canManageUsers: boolean;
		};
	}
}
