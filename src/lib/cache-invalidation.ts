import { revalidatePath, revalidateTag } from "next/cache";
import {
	CACHE_PROFILE,
	CACHE_TAGS,
	PAGE_TAGS,
	blogTag,
} from "@/lib/cache-keys";

const bust = (tag: string) => revalidateTag(tag, CACHE_PROFILE);

/** All blog caches (single posts + lists). Use for create/delete/publish. */
export function invalidateBlogs() {
	bust(CACHE_TAGS.blogs);
	bust(CACHE_TAGS.blogList);
	bust(CACHE_TAGS.articleVotes);
}

/**
 * One article plus the lists it appears in — NOT every other post's cache.
 * Use for per-article interactions (comments, votes) where the slug is known.
 */
export function invalidateArticle(slug?: string | null) {
	if (slug) {
		bust(blogTag(slug));
		revalidatePath(`/articles/${slug}`);
	} else {
		// No slug: fall back to the broad blog tag so nothing goes stale.
		bust(CACHE_TAGS.blogs);
	}
	bust(CACHE_TAGS.blogList);
}

export function invalidateComments() {
	bust(CACHE_TAGS.comments);
}

export function invalidateUsers() {
	bust(CACHE_TAGS.users);
}

export function invalidateStats() {
	bust(CACHE_TAGS.stats);
}

export function invalidateNewsletter() {
	bust(CACHE_TAGS.newsletter);
}

export function invalidatePages() {
	bust(CACHE_TAGS.pages);
	for (const tag of Object.values(PAGE_TAGS)) bust(tag);
}

/** Everything. Backs the admin "Purge Everything" action. */
export function invalidateAll() {
	invalidateBlogs();
	invalidateComments();
	invalidateUsers();
	invalidatePages();
	invalidateNewsletter();
	invalidateStats();
	revalidatePath("/");
	revalidatePath("/admin");
}
