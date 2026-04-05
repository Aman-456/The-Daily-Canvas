"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/utils";

export async function clearAppCache(type: 'blogs' | 'comments' | 'users' | 'pages' | 'homepage' | 'newsletter' | 'stats' | 'all') {
    const session = await auth();
    if (!isAdmin(session?.user?.role)) {
        return { success: false, error: "Unauthorized: Admin only" };
    }

    try {
        switch (type) {
            case 'blogs':
                revalidateTag('blogs', 'max');
                revalidatePath('/admin/blogs');
                break;
            case 'comments':
                revalidateTag('comments', 'max');
                revalidatePath('/admin/comments');
                break;
            case 'users':
                revalidateTag('users', 'max');
                revalidatePath('/admin/users');
                break;
            case 'pages':
                revalidateTag('pages', 'max');
                revalidateTag('page-privacy-policy', 'max');
                revalidateTag('page-terms-of-service', 'max');
                revalidatePath('/admin/pages');
                break;
            case 'newsletter':
                revalidateTag('newsletter-subscribers', 'max');
                revalidatePath('/admin/newsletter');
                break;
            case 'stats':
                revalidateTag('stats', 'max');
                revalidatePath('/admin');
                break;
            case 'homepage':
                revalidatePath('/');
                break;
            case 'all':
                revalidateTag('blogs', 'max');
                revalidateTag('comments', 'max');
                revalidateTag('users', 'max');
                revalidateTag('pages', 'max');
                revalidateTag('page-privacy-policy', 'max');
                revalidateTag('page-terms-of-service', 'max');
                revalidateTag('newsletter-subscribers', 'max');
                revalidateTag('stats', 'max');
                revalidatePath('/');
                revalidatePath('/admin');
                break;
        }
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
