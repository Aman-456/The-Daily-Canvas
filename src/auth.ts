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
		strategy: "database",
	},
	callbacks: {
		async session({ session, user }) {
			if (user?.id) {
				// Fetch the FULL user record from your custom schema
				const dbUser = await db.query.users.findFirst({
					where: eq(users.id, user.id),
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
