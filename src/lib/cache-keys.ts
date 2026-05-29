/**
 * Single source of truth for cache tag names used with `unstable_cache` and
 * `revalidateTag`. Pure constants only (no `next/cache` import) so this stays
 * safe to import from client components (e.g. the admin cache manager UI).
 *
 * Invalidation helpers that actually call `revalidateTag` live in
 * `src/lib/cache-invalidation.ts` (server-only).
 */

/** Broad, entity-level tags. */
export const CACHE_TAGS = {
	/** Every blog cache: single posts + lists. Use for create/delete/publish. */
	blogs: "blogs",
	/** Blog list / home / spotlight / teaser caches only. */
	blogList: "blogs-list",
	comments: "comments",
	users: "users",
	pages: "pages",
	newsletter: "newsletter-subscribers",
	stats: "stats",
	/** Aggregate article vote scores. */
	articleVotes: "article-votes",
} as const;

/** Per-CMS-page tags for the public static pages backed by the `pages` table. */
export const PAGE_TAGS = {
	privacyPolicy: "page-privacy-policy",
	termsOfService: "page-terms-of-service",
	faq: "page-faq",
	changelog: "page-changelog",
} as const;

/** Granular tag for a single article, so one comment/vote busts only that post. */
export const blogTag = (slug: string) => `blog:${slug}`;

/** Cache profile passed to `revalidateTag` (Next 16 requires a profile arg). */
export const CACHE_PROFILE = "max" as const;

/** Logical cache groups exposed by the admin cache manager + `clearAppCache`. */
export const CACHE_GROUPS = [
	"homepage",
	"blogs",
	"comments",
	"users",
	"pages",
	"newsletter",
	"stats",
	"all",
] as const;

export type CacheGroup = (typeof CACHE_GROUPS)[number];
