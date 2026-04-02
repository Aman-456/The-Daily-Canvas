import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db/index";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
	...authConfig,
	adapter: DrizzleAdapter(db),
	session: {
		// Credentials auth in development is easiest with JWT sessions (no DB session write needed).
		strategy: process.env.NODE_ENV === "development" ? "jwt" : "database",
	},
	callbacks: {
		async jwt({ token, user }) {
			// On sign-in, persist user id into the token.
			if (user?.id) {
				token.sub = user.id;
			}
			return token;
		},
		async session({ session, user, token }) {
			const tokenSub =
				token && typeof (token as { sub?: unknown }).sub === "string"
					? (token as { sub: string }).sub
					: undefined;

			const userId = user?.id ?? tokenSub ?? session?.user?.id;

			if (userId) {
				// Ensure id exists even for JWT sessions
				session.user.id = userId;

				// Fetch the FULL user record from your custom schema
				const dbUser = await db.query.users.findFirst({
					where: eq(users.id, userId),
				});

				if (dbUser) {
					session.user.id = dbUser.id;
					session.user.name = dbUser.name || session.user.name;
					session.user.email = dbUser.email || session.user.email;
					session.user.image = dbUser.image || session.user.image;

					// Now you get the full custom fields
					session.user.role = dbUser.role || "USER";
					session.user.permissions = dbUser.permissions || {
						canSeeStats: false,
						canManageBlogs: true,
						canManageComments: true,
						canManagePages: false,
						canManageUsers: false,
					};
				}
			}
			return session;
		},
	},
	events: {
		async createUser({ user }) {
			// This ensures that new users created via NextAuth adapter 
			// have the 'USER' role explicitly set in the database.
			if (user.id) {
				await db.update(users)
					.set({
						role: "USER",
						permissions: {
							canSeeStats: false,
							canManageBlogs: true,
							canManageComments: true,
							canManagePages: false,
							canManageUsers: false,
						},
					})
					.where(eq(users.id, user.id));
			}
		}
	}
});
