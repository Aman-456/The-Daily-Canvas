"use server";

import { db } from "@/db/index";
import { users, blogs, comments } from "@/db/schema";
import { unstable_cache } from "next/cache";
import { eq, inArray, count } from "drizzle-orm";
import type { UserPermissions } from "@/lib/constants";

export const getCachedStats = unstable_cache(
  async (userId?: string, role?: string, permissions?: UserPermissions | null) => {
    const isNonAdmin = role === "USER";
    const lacksStatsPermission = !permissions?.canSeeStats;

    if (isNonAdmin && lacksStatsPermission && userId) {
      // Users/Subadmins without explicit permission only see stats for their own blogs
      const userBlogs = await db.select({ id: blogs.id }).from(blogs).where(eq(blogs.authorId, userId));
      const blogIds = userBlogs.map(b => b.id);

      const [userCountResult, blogCountResult, commentCountResult] = await Promise.all([
        db.select({ count: count() }).from(users).where(eq(users.id, userId)),
        db.select({ count: count() }).from(blogs).where(eq(blogs.authorId, userId)),
        blogIds.length > 0 
          ? db.select({ count: count() }).from(comments).where(inArray(comments.blogId, blogIds))
          : Promise.resolve([{ count: 0 }]),
      ]);

      return [userCountResult[0].count, blogCountResult[0].count, commentCountResult[0].count];
    }

    const [userCountResult, blogCountResult, commentCountResult] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(blogs),
      db.select({ count: count() }).from(comments),
    ]);

    return [userCountResult[0].count, blogCountResult[0].count, commentCountResult[0].count];
  },
  ["admin-dashboard-stats"],
  { revalidate: 86400, tags: ["stats"] }
);
