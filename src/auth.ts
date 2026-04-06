import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db/index";
import { sessions, users } from "./db/schema";
import { insertAdminOnlyNotification } from "./lib/notify-admins";
import { eq } from "drizzle-orm";
import { authConfig } from "./auth.config";
import type { Session } from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
	...authConfig,
	adapter: DrizzleAdapter(db),
	session: {
		// Credentials auth in development is easiest with JWT sessions (no DB session write needed).
		strategy: process.env.NODE_ENV === "development" ? "jwt" : "database",
	},
	callbacks: {
		async signIn({ user, account, profile }) {
			if (account?.provider === "credentials") {
				return true;
			}
			const email =
				(user.email?.trim() ||
					(profile as { email?: string } | undefined)?.email?.trim()) ??
				"";
			if (!email) return false;

			const dbUser = await db.query.users.findFirst({
				where: eq(users.email, email),
			});
			if (dbUser?.isDisabled) return false;
			return true;
		},
		async jwt({ token, user }) {
			// On sign-in, persist user id into the token.
			if (user?.id) {
				token.sub = user.id;
			}
			const sub =
				token && typeof (token as { sub?: unknown }).sub === "string"
					? (token as { sub: string }).sub
					: undefined;
			if (sub) {
				const dbUser = await db.query.users.findFirst({
					where: eq(users.id, sub),
				});
				if (dbUser?.isDisabled) {
					return null;
				}
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
				// Fetch the FULL user record from your custom schema
				const dbUser = await db.query.users.findFirst({
					where: eq(users.id, userId),
				});

				if (dbUser?.isDisabled) {
					await db.delete(sessions).where(eq(sessions.userId, userId));
					return null as unknown as Session;
				}

				// Ensure id exists even for JWT sessions
				session.user.id = userId;

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
				await db
					.update(users)
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

				try {
					const label =
						user.name && user.email
							? `${user.name} (${user.email})`
							: user.email || user.name || user.id;
					await insertAdminOnlyNotification({
						type: "USER_SIGNUP",
						message: `New member signed up: ${label}`,
						link: "/admin/users",
						blogLink: "/admin/users",
						userIdForFk: user.id,
					});
				} catch (notifErr) {
					console.error("[auth createUser] admin notification:", notifErr);
				}
			}
		},
	}
});
