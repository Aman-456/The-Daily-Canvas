import type { BlogListSort } from "./blog-list-sort";

function appendListingParams(
	p: URLSearchParams,
	opts: { page?: number; search?: string; sort?: BlogListSort },
) {
	if (opts.page && opts.page > 1) p.set("page", String(opts.page));
	if (opts.search?.trim()) p.set("query", opts.search.trim());
	if (opts.sort && opts.sort !== "newest") p.set("sort", opts.sort);
}

/**
 * Canonical blog tags: `slug` is stored in the database; `label` is shown in the UI.
 * Optional `aliases` are extra tokens (e.g. “ai”, “economy”) that resolve to the same slug when normalizing input.
 */
type BlogTagEntry = {
	slug: string;
	label: string;
	/** Extra tokens that normalize to this slug (lowercased when matched). */
	aliases: readonly string[];
};

/**
 * Short public topic list (filters, `/topics/[slug]`, admin checkboxes).
 * Aliases help map keywords / legacy labels into these slugs.
 */
export const BLOG_TAGS = [
	{
		slug: "politics",
		label: "Politics",
		aliases: ["political", "government", "govt", "opinion", "editorial", "column"],
	},
	{ slug: "pakistan", label: "Pakistan", aliases: ["pak", "pakistani"] },
	{ slug: "south-asia", label: "South Asia", aliases: ["south asian", "subcontinent"] },
	{
		slug: "world-affairs",
		label: "World Affairs",
		aliases: ["international", "geopolitics", "global affairs", "current events", "news", "headlines"],
	},
	{
		slug: "energy",
		label: "Energy",
		aliases: ["power", "utilities", "grid", "oil", "solar", "renewable", "gas"],
	},
	{
		slug: "economics",
		label: "Economics",
		aliases: ["economy", "macro", "markets", "finance", "business", "investing", "stocks"],
	},
	{
		slug: "technology",
		label: "Technology",
		aliases: ["tech", "hardware", "semiconductors", "gadgets", "software", "science", "chips"],
	},
	{
		slug: "artificial-intelligence",
		label: "AI",
		aliases: ["ai", "machine learning", "ml", "deep learning", "generative ai", "chatgpt"],
	},
	{
		slug: "computing",
		label: "Computing",
		aliases: ["computer", "programming", "coding", "developer", "it", "ict", "education", "learning"],
	},
	{
		slug: "cyber-security",
		label: "Cyber Security",
		aliases: ["cybersecurity", "infosec", "cyber", "security", "quantum"],
	},
	{
		slug: "environment",
		label: "Environment",
		aliases: [
			"climate",
			"climate change",
			"sustainability",
			"green",
			"nature",
			"ecology",
			"carbon",
			"pollution",
		],
	},
	{
		slug: "health",
		label: "Health",
		aliases: ["wellness", "fitness", "mental health", "medicine", "nutrition", "smog", "air quality"],
	},
] as const satisfies readonly BlogTagEntry[];

/** Old catalog slugs still stored in DB or bookmarks → current slug. */
const LEGACY_TO_CANONICAL_SLUG: Record<string, string> = {
	"climate-change": "environment",
	essay: "politics",
	"current-events": "world-affairs",
	opinion: "politics",
	life: "politics",
	semiconductors: "technology",
	hardware: "technology",
	software: "technology",
	"machine-learning": "artificial-intelligence",
	education: "computing",
};

export type BlogTagDefinition = (typeof BLOG_TAGS)[number];
export type BlogTagSlug = BlogTagDefinition["slug"];

const SLUG_SET = new Set<string>(BLOG_TAGS.map((t) => t.slug));

const LABEL_TO_SLUG = new Map(
	BLOG_TAGS.map((t) => [t.label.toLowerCase(), t.slug] as const),
);

/** Built from each tag’s `aliases` on `BLOG_TAGS`. */
const ALIAS_TO_SLUG = new Map<string, string>();
for (const entry of BLOG_TAGS as readonly BlogTagEntry[]) {
	for (const a of entry.aliases) {
		ALIAS_TO_SLUG.set(a.toLowerCase(), entry.slug);
	}
}

export function isBlogTagSlug(s: string): s is BlogTagSlug {
	return SLUG_SET.has(s);
}

/** Display string for a stored tag (slug or legacy free-form text). */
export function blogTagLabel(stored: string): string {
	const bySlug = BLOG_TAGS.find((t) => t.slug === stored);
	if (bySlug) return bySlug.label;
	const legacyCanon = LEGACY_TO_CANONICAL_SLUG[stored.toLowerCase()];
	if (legacyCanon) {
		const mapped = BLOG_TAGS.find((t) => t.slug === legacyCanon);
		if (mapped) return mapped.label;
	}
	const slugFromLabel = LABEL_TO_SLUG.get(stored.toLowerCase());
	if (slugFromLabel) {
		return BLOG_TAGS.find((t) => t.slug === slugFromLabel)!.label;
	}
	return stored;
}

/** If stored value is a known slug (or legacy label), return slug for links; else null. */
export function blogTagSlugForLink(stored: string): string | null {
	if (isBlogTagSlug(stored)) return stored;
	return resolveToBlogTagSlug(stored);
}

/** Map user/form input to a canonical slug, or null if unknown. */
export function resolveToBlogTagSlug(token: string): string | null {
	const trimmed = token.trim();
	if (!trimmed) return null;
	if (SLUG_SET.has(trimmed)) return trimmed;
	const lower = trimmed.toLowerCase();
	if (SLUG_SET.has(lower)) return lower;
	const fromLabel = LABEL_TO_SLUG.get(lower);
	if (fromLabel) return fromLabel;
	const hyphenated = lower.replace(/\s+/g, "-");
	if (SLUG_SET.has(hyphenated)) return hyphenated;
	const fromAlias = ALIAS_TO_SLUG.get(lower) ?? ALIAS_TO_SLUG.get(hyphenated);
	if (fromAlias) return fromAlias;
	const legacy =
		LEGACY_TO_CANONICAL_SLUG[lower] ??
		LEGACY_TO_CANONICAL_SLUG[hyphenated] ??
		LEGACY_TO_CANONICAL_SLUG[trimmed];
	if (legacy && SLUG_SET.has(legacy)) return legacy;
	return null;
}

/** `/topics/[slug]` path segment → current catalog slug, or null. */
export function resolveTopicSlugForPath(pathSlug: string): string | null {
	const lower = pathSlug.toLowerCase();
	if (SLUG_SET.has(pathSlug)) return pathSlug;
	if (SLUG_SET.has(lower)) return lower;
	const canon = LEGACY_TO_CANONICAL_SLUG[lower];
	return canon && SLUG_SET.has(canon) ? canon : null;
}

function tokensFromUnknown(val: unknown): string[] {
	if (val === null || val === undefined) return [];
	if (Array.isArray(val)) {
		return val
			.filter((item): item is string => typeof item === "string")
			.flatMap((item) =>
				item
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean),
			);
	}
	if (typeof val === "string") {
		return val
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}
	return [];
}

/** Ordered unique list of allowed tag slugs only. */
export function normalizeBlogTagSlugs(val: unknown): string[] {
	const out: string[] = [];
	const seen = new Set<string>();
	for (const token of tokensFromUnknown(val)) {
		const slug = resolveToBlogTagSlug(token);
		if (!slug || seen.has(slug)) continue;
		seen.add(slug);
		out.push(slug);
	}
	return out;
}

/** Canonical path for a single topic (SEO-friendly). */
export function topicPath(slug: string): string {
	if (!isBlogTagSlug(slug)) return "/";
	return `/topics/${slug}`;
}

/** Topic listing with optional `search`, `page`, and `sort` (query only; slug is in the path). */
export function topicListingHref(opts: {
	slug: string;
	search?: string;
	page?: number;
	sort?: BlogListSort;
}): string {
	if (!isBlogTagSlug(opts.slug)) return "/";
	if (opts.search?.trim()) {
		return searchListingHref({
			tags: [opts.slug],
			search: opts.search,
			page: opts.page,
			sort: opts.sort,
		});
	}
	const p = new URLSearchParams();
	appendListingParams(p, {
		page: opts.page,
		sort: opts.sort,
	});
	const qs = p.toString();
	return qs ? `/topics/${opts.slug}?${qs}` : `/topics/${opts.slug}`;
}

/** Canonical title search + optional topic filters (`?query=` + repeated `?tag=`). */
export function searchListingHref(opts: {
	tags?: string[];
	/** @deprecated use `tags: [slug]` */
	tag?: string;
	search?: string;
	page?: number;
	sort?: BlogListSort;
}): string {
	const fromOpts = opts.tags?.length
		? opts.tags
		: opts.tag && isBlogTagSlug(opts.tag)
			? [opts.tag]
			: [];
	const unique = [...new Set(fromOpts.filter(isBlogTagSlug))].sort();
	const p = new URLSearchParams();
	appendListingParams(p, {
		page: opts.page,
		search: opts.search,
		sort: opts.sort,
	});
	for (const t of unique) {
		p.append("tag", t);
	}
	const qs = p.toString();
	return qs ? `/search?${qs}` : "/search";
}

/** Link from a post to that topic’s browse page. */
export function blogTagFilterHref(slug: string): string {
	return topicListingHref({ slug });
}

/**
 * Home `/`: no topic or multi-topic (`?tag=a&tag=b`). Title search uses `/search` (see `searchListingHref`).
 * Single-topic views use `/topics/[slug]` (see `topicListingHref`).
 */
export function blogListingHref(opts: {
	tags?: string[];
	/** @deprecated use `tags: [slug]` or `topicListingHref` */
	tag?: string;
	search?: string;
	page?: number;
	sort?: BlogListSort;
}): string {
	const fromOpts = opts.tags?.length
		? opts.tags
		: opts.tag && isBlogTagSlug(opts.tag)
			? [opts.tag]
			: [];
	const unique = [...new Set(fromOpts.filter(isBlogTagSlug))].sort();
	const search = opts.search ?? "";
	const page = opts.page ?? 1;
	const sort = opts.sort;

	if (search.trim()) {
		return searchListingHref({ tags: unique, search, page, sort });
	}

	if (unique.length === 1) {
		return topicListingHref({
			slug: unique[0],
			page,
			sort,
		});
	}

	const p = new URLSearchParams();
	appendListingParams(p, { page, sort });
	for (const t of unique) {
		p.append("tag", t);
	}
	const qs = p.toString();
	return qs ? `/?${qs}` : "/";
}

/**
 * Paginated `/archive` listing: same query rules as `blogListingHref`, but base path
 * `/archive` when there are 0 or 2+ tags. Single-tag still uses `/topics/[slug]`.
 */
export function archiveListingHref(opts: {
	tags?: string[];
	/** @deprecated use `tags: [slug]` or `topicListingHref` */
	tag?: string;
	search?: string;
	page?: number;
	sort?: BlogListSort;
}): string {
	const fromOpts = opts.tags?.length
		? opts.tags
		: opts.tag && isBlogTagSlug(opts.tag)
			? [opts.tag]
			: [];
	const unique = [...new Set(fromOpts.filter(isBlogTagSlug))].sort();
	const search = opts.search ?? "";
	const page = opts.page ?? 1;
	const sort = opts.sort;

	if (search.trim()) {
		return searchListingHref({ tags: unique, search, page, sort });
	}

	if (unique.length === 1) {
		return topicListingHref({
			slug: unique[0],
			page,
			sort,
		});
	}

	const p = new URLSearchParams();
	appendListingParams(p, { page, sort });
	for (const t of unique) {
		p.append("tag", t);
	}
	const qs = p.toString();
	return qs ? `/archive?${qs}` : "/archive";
}

export type TopicListingBase = "home" | "archive" | "search";

/** Chip navigation: search queries use `/search`; otherwise home, archive, or topic paths. */
export function hrefForActiveTags(
	tags: string[],
	search: string,
	listingBase: TopicListingBase = "home",
	sort?: BlogListSort,
): string {
	const unique = [...new Set(tags.filter(isBlogTagSlug))].sort();

	if (listingBase === "search") {
		return searchListingHref({ tags: unique, search, sort });
	}

	if (search.trim()) {
		return searchListingHref({ tags: unique, search, sort });
	}

	if (unique.length === 0) {
		return listingBase === "archive"
			? archiveListingHref({ sort })
			: blogListingHref({ sort });
	}
	if (unique.length === 1) {
		return topicListingHref({ slug: unique[0], sort });
	}
	return listingBase === "archive"
		? archiveListingHref({ tags: unique, sort })
		: blogListingHref({ tags: unique, sort });
}

function firstParamString(
	v: string | string[] | undefined,
): string | undefined {
	if (typeof v === "string") return v;
	if (Array.isArray(v) && typeof v[0] === "string") return v[0];
	return undefined;
}

/**
 * Title search text from `?query=` (preferred) or legacy `?search=`.
 * Use on server from `searchParams`.
 */
export function parseListingTitleQuery(params: {
	[key: string]: string | string[] | undefined;
}): string {
	const q = firstParamString(params.query)?.trim() ?? "";
	if (q) return q;
	return firstParamString(params.search)?.trim() ?? "";
}

/** Client: same rules as `parseListingTitleQuery` for `URLSearchParams`. */
export function listingTitleQueryFromUrlSearchParams(sp: URLSearchParams): string {
	const q = sp.get("query")?.trim() ?? "";
	if (q) return q;
	return sp.get("search")?.trim() ?? "";
}

/** Only `?query=` (no legacy `?search=`). Use with a legacy redirect to canonical URLs. */
export function parseListingQueryParamOnly(params: {
	[key: string]: string | string[] | undefined;
}): string {
	return firstParamString(params.query)?.trim() ?? "";
}

/** Validated tag slugs from Next.js `searchParams` (supports repeated `tag`). */
export function parseTagSlugsFromSearchParams(params: {
	[key: string]: string | string[] | undefined;
}): string[] {
	const raw = params.tag;
	if (raw === undefined) return [];
	const list = Array.isArray(raw) ? raw : [raw];
	return [
		...new Set(
			list.filter(
				(x): x is string => typeof x === "string" && isBlogTagSlug(x),
			),
		),
	].sort();
}
