import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const hasGoogleOAuth = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const authConfig = {
	providers: [
		...(hasGoogleOAuth
			? [
					Google({
						clientId: process.env.AUTH_GOOGLE_ID,
						clientSecret: process.env.AUTH_GOOGLE_SECRET,
						allowDangerousEmailAccountLinking: process.env.NODE_ENV === "development",
					}),
				]
			: []),
		...(process.env.NODE_ENV === "development"
			? [
					Credentials({
						name: "Dev Admin (local)",
						credentials: {
							email: { label: "Email", type: "email" },
							password: { label: "Password", type: "password" },
						},
						async authorize(credentials) {
							const devEmail = process.env.DEV_ADMIN_EMAIL;
							const devPassword = process.env.DEV_ADMIN_PASSWORD;

							if (!devEmail || !devPassword) return null;

							const parsed = z
								.object({
									email: z.string().email(),
									password: z.string().min(1),
								})
								.safeParse(credentials);

							if (!parsed.success) return null;
							if (parsed.data.email !== devEmail) return null;
							if (parsed.data.password !== devPassword) return null;

							const existing = await db.query.users.findFirst({
								where: eq(users.email, devEmail),
							});

							if (existing) {
								// Always enforce full admin perms for dev credentials sign-in
								await db
									.update(users)
									.set({
										role: "ADMIN",
										permissions: {
											canSeeStats: true,
											canManageBlogs: true,
											canManageComments: true,
											canManagePages: true,
											canManageUsers: true,
										},
									})
									.where(eq(users.id, existing.id));

								return {
									id: existing.id,
									email: existing.email,
									name: existing.name ?? "Dev Admin",
									image: existing.image ?? null,
								};
							}

							const inserted = await db
								.insert(users)
								.values({
									email: devEmail,
									name: "Dev Admin",
									role: "ADMIN",
									permissions: {
										canSeeStats: true,
										canManageBlogs: true,
										canManageComments: true,
										canManagePages: true,
										canManageUsers: true,
									},
								})
								.returning({ id: users.id, email: users.email, name: users.name, image: users.image });

							const u = inserted[0];
							if (!u) return null;

							return {
								id: u.id,
								email: u.email,
								name: u.name ?? "Dev Admin",
								image: u.image ?? null,
							};
						},
					}),
				]
			: []),
	],
	pages: {
		signIn: "/signin",
	},
	secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
	trustHost: true,
} satisfies NextAuthConfig;
