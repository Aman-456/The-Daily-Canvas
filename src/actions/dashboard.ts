"use server";

import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Blog from "@/models/Blog";
import Comment from "@/models/Comment";
import { unstable_cache } from "next/cache";

export const getCachedStats = unstable_cache(
  async (userId?: string, role?: string, permissions?: any) => {
    await dbConnect();
    
    let userQuery = {};
    let blogQuery = {};
    let commentQuery = {};

    const isNonAdmin = role === "USER";
    const lacksStatsPermission = !permissions?.canSeeStats;

    if (isNonAdmin && lacksStatsPermission && userId) {
      // Users/Subadmins without explicit permission only see stats for their own blogs
      blogQuery = { authorId: userId };
      const userBlogs = await Blog.find({ authorId: userId }).select("_id").lean();
      const blogIds = userBlogs.map(b => b._id);
      commentQuery = { blogId: { $in: blogIds } };
      userQuery = { _id: userId };
    }

    return Promise.all([
      User.countDocuments(userQuery),
      Blog.countDocuments(blogQuery),
      Comment.countDocuments(commentQuery),
    ]);
  },
  ["admin-dashboard-stats"],
  { revalidate: 86400, tags: ["stats"] }
);
