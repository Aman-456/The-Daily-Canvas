"use server";

import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Blog from "@/models/Blog";
import Comment from "@/models/Comment";
import { unstable_cache } from "next/cache";

export const getCachedStats = unstable_cache(
  async () => {
    await dbConnect();
    return Promise.all([
      User.countDocuments(),
      Blog.countDocuments(),
      Comment.countDocuments(),
    ]);
  },
  ["admin-dashboard-stats"],
  { revalidate: 86400, tags: ["stats"] }
);
