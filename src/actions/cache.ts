"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/utils";
import type { CacheGroup } from "@/lib/cache-keys";
import {
    invalidateAll,
    invalidateBlogs,
    invalidateComments,
    invalidateNewsletter,
    invalidatePages,
    invalidateStats,
    invalidateUsers,
} from "@/lib/cache-invalidation";

export async function clearAppCache(type: CacheGroup) {
    const session = await auth();
    if (!isAdmin(session?.user?.role)) {
        return { success: false, error: "Unauthorized: Admin only" };
    }

    try {
        switch (type) {
            case 'blogs':
                invalidateBlogs();
                revalidatePath('/admin/blogs');
                break;
            case 'comments':
                invalidateComments();
                revalidatePath('/admin/comments');
                break;
            case 'users':
                invalidateUsers();
                revalidatePath('/admin/users');
                break;
            case 'pages':
                invalidatePages();
                revalidatePath('/admin/pages');
                break;
            case 'newsletter':
                invalidateNewsletter();
                revalidatePath('/admin/newsletter');
                break;
            case 'stats':
                invalidateStats();
                revalidatePath('/admin');
                break;
            case 'homepage':
                revalidatePath('/');
                break;
            case 'all':
                invalidateAll();
                break;
        }
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to clear cache",
        };
    }
}
