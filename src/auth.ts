import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./lib/mongodb";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
	...authConfig,
	adapter: MongoDBAdapter(clientPromise),
	session: {
		strategy: "database",
	},
	callbacks: {
		async session({ session, user }) {
			if (user) {
				session.user.id = user.id;
				session.user.role = (user as any).role || "USER";
				session.user.permissions = (user as any).permissions || {};
				session.user.name = user.name || session.user.name;
				session.user.email = user.email || session.user.email;
				session.user.image = user.image || session.user.image;
			}
			return session;
		},
	},
	events: {
		async createUser({ user }) {
			// This ensures that new users created via NextAuth adapter 
			// have the 'USER' role explicitly set in the database.
			const client = await clientPromise;
			const db = client.db();
			await db.collection("users").updateOne(
				{ _id: new (require("mongodb").ObjectId)(user.id) },
				{
					$set: {
						role: "USER",
						permissions: {
							canSeeStats: false,
							canManageBlogs: true,
							canManageComments: true,
							canManagePages: false,
							canManageUsers: false
						}
					}
				}
			);
		}
	}
});
