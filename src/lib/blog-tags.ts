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

export const BLOG_TAGS = [
	// News, Society & Opinion
	{ slug: "politics", label: "Politics", aliases: ["political", "government", "govt"] },
	{
		slug: "world-affairs",
		label: "World Affairs",
		aliases: ["global affairs", "international", "geopolitics"],
	},
	{ slug: "pakistan", label: "Pakistan", aliases: ["pak", "pakistani"] },
	{ slug: "south-asia", label: "South Asia", aliases: ["south asian", "subcontinent"] },
	{ slug: "current-events", label: "Current Events", aliases: ["news", "headlines", "breaking"] },
	{ slug: "opinion", label: "Opinion", aliases: ["editorial", "commentary", "column"] },

	// Technology & Computing
	{ slug: "technology", label: "Technology", aliases: ["tech"] },
	{ slug: "hardware", label: "Hardware", aliases: ["pc", "components"] },
	{
		slug: "semiconductors",
		label: "Semiconductors",
		aliases: ["chips", "semiconductor", "silicon"],
	},
	{ slug: "energy", label: "Energy", aliases: ["power", "utilities", "grid"] },
	{ slug: "computing", label: "Computing", aliases: ["computer", "it", "ict"] },
	{
		slug: "cyber-security",
		label: "Cyber Security",
		aliases: ["cybersecurity", "infosec", "cyber"],
	},
	{
		slug: "artificial-intelligence",
		label: "Artificial Intelligence",
		aliases: ["ai", "gen ai", "generative ai"],
	},
	{
		slug: "machine-learning",
		label: "Machine Learning",
		aliases: ["ml", "deep learning", "dl"],
	},
	{ slug: "programming", label: "Programming", aliases: ["coding", "coder", "developer"] },
	{
		slug: "web-development",
		label: "Web Development",
		aliases: ["webdev", "web dev", "frontend", "front-end"],
	},
	{ slug: "software", label: "Software", aliases: ["apps", "applications", "saas"] },
	{ slug: "gadgets", label: "Gadgets", aliases: ["devices", "consumer tech"] },
	{ slug: "crypto", label: "Cryptocurrency", aliases: ["cryptocurrency", "bitcoin", "defi"] },
	{ slug: "blockchain", label: "Blockchain", aliases: ["web3", "distributed ledger"] },

	// Business & Finance
	{ slug: "business", label: "Business", aliases: ["biz", "commerce", "enterprise"] },
	{ slug: "economics", label: "Economics", aliases: ["economy", "macro", "markets"] },
	{ slug: "finance", label: "Finance", aliases: ["financial", "banking", "fintech"] },
	{ slug: "investing", label: "Investing", aliases: ["investment", "stocks", "portfolio"] },
	{
		slug: "entrepreneurship",
		label: "Entrepreneurship",
		aliases: ["entrepreneur", "founder", "startup founder"],
	},
	{ slug: "startups", label: "Startups", aliases: ["startup", "venture", "vc"] },
	{ slug: "marketing", label: "Marketing", aliases: ["branding", "advertising", "growth"] },
	{ slug: "sales", label: "Sales", aliases: ["selling", "revenue", "crm"] },
	{ slug: "leadership", label: "Leadership", aliases: ["leader", "executive", "ceo"] },
	{ slug: "management", label: "Management", aliases: ["manager", "operations", "ops"] },
	{
		slug: "side-hustle",
		label: "Side Hustle",
		aliases: ["side hustle", "freelance", "gig economy"],
	},

	// Personal Development & Productivity
	{
		slug: "personal-growth",
		label: "Personal Growth",
		aliases: ["self growth", "development", "growth mindset"],
	},
	{
		slug: "self-improvement",
		label: "Self Improvement",
		aliases: ["self help", "betterment", "self-development"],
	},
	{
		slug: "productivity",
		label: "Productivity",
		aliases: ["efficiency", "time management", "deep work"],
	},
	{ slug: "motivation", label: "Motivation", aliases: ["inspire", "drive", "willpower"] },
	{ slug: "success", label: "Success", aliases: ["achievement", "goals", "winning"] },
	{ slug: "habits", label: "Habits", aliases: ["habit", "routines", "rituals"] },
	{ slug: "mindfulness", label: "Mindfulness", aliases: ["meditation", "awareness", "presence"] },

	// Health & Wellness
	{ slug: "health", label: "Health", aliases: ["healthy", "wellbeing", "well-being"] },
	{
		slug: "mental-health",
		label: "Mental Health",
		aliases: ["therapy", "anxiety", "depression"],
	},
	{ slug: "fitness", label: "Fitness", aliases: ["workout", "exercise", "gym"] },
	{ slug: "nutrition", label: "Nutrition", aliases: ["diet", "eating", "macros"] },
	{ slug: "wellness", label: "Wellness", aliases: ["holistic", "self-care", "balance"] },
	{ slug: "yoga", label: "Yoga", aliases: ["asana", "stretching", "mind-body"] },

	// Lifestyle & Daily Life
	{ slug: "life", label: "Life", aliases: ["living", "daily life", "existence"] },
	{ slug: "lifestyle", label: "Lifestyle", aliases: ["way of life", "life design"] },
	{
		slug: "relationships",
		label: "Relationships",
		aliases: ["dating", "marriage", "partnership"],
	},
	{ slug: "parenting", label: "Parenting", aliases: ["parents", "kids", "family life"] },
	{ slug: "travel", label: "Travel", aliases: ["tourism", "trip", "vacation"] },
	{ slug: "food", label: "Food", aliases: ["cuisine", "eating", "dining"] },
	{ slug: "recipes", label: "Recipes", aliases: ["cooking", "cookbook", "baking"] },
	{ slug: "fashion", label: "Fashion", aliases: ["style", "apparel", "outfits"] },
	{ slug: "beauty", label: "Beauty", aliases: ["skincare", "makeup", "cosmetics"] },
	{
		slug: "home-decor",
		label: "Home Decor",
		aliases: ["interior design", "decorating", "interiors"],
	},
	{
		slug: "minimalism",
		label: "Minimalism",
		aliases: ["simple living", "declutter", "essentialism"],
	},

	// Culture, Arts & Humanities
	{ slug: "culture", label: "Culture", aliases: ["cultural", "society", "heritage"] },
	{ slug: "art", label: "Art", aliases: ["arts", "fine art", "visual art"] },
	{ slug: "literature", label: "Literature", aliases: ["books", "fiction", "novels"] },
	{ slug: "poetry", label: "Poetry", aliases: ["poems", "verse", "poet"] },
	{ slug: "music", label: "Music", aliases: ["songs", "audio", "musician"] },
	{ slug: "film", label: "Film", aliases: ["movies", "cinema", "hollywood"] },
	{ slug: "theater", label: "Theater", aliases: ["theatre", "drama", "stage"] },
	{ slug: "history", label: "History", aliases: ["historical", "past", "archive"] },
	{ slug: "philosophy", label: "Philosophy", aliases: ["ethics", "logic", "thinkers"] },
	{ slug: "psychology", label: "Psychology", aliases: ["behavior", "cognitive", "psych"] },

	// Environment & Sustainability
	{ slug: "environment", label: "Environment", aliases: ["nature", "ecology", "ecosystem"] },
	{
		slug: "sustainability",
		label: "Sustainability",
		aliases: ["sustainable", "green", "esg"],
	},
	{
		slug: "climate-change",
		label: "Climate Change",
		aliases: ["climate", "global warming", "carbon"],
	},

	// Education & Learning
	{ slug: "education", label: "Education", aliases: ["school", "teaching", "academic"] },
	{ slug: "learning", label: "Learning", aliases: ["study", "studying", "skills"] },

	// Other Popular Niches
	{ slug: "essay", label: "Essay", aliases: ["essays", "longform", "op-ed"] },
	{ slug: "review", label: "Review", aliases: ["reviews", "critique", "rating"] },
	{ slug: "how-to", label: "How To", aliases: ["howto", "tutorial", "guide"] },
	{ slug: "diy", label: "DIY", aliases: ["do it yourself", "homemade", "maker"] },
	{ slug: "gaming", label: "Gaming", aliases: ["games", "esports", "videogames"] },
	{ slug: "pets", label: "Pets", aliases: ["pet", "dogs", "cats"] },
] as const satisfies readonly BlogTagEntry[];

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
	return null;
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

/** Browse home with a single-topic filter (replaces any multi-tag selection). */
export function blogTagFilterHref(slug: string): string {
	return blogListingHref({ tags: [slug] });
}

/** Home listing URL: multiple `tag` params = AND filter. Page 1 omits `page`. */
export function blogListingHref(opts: {
	tags?: string[];
	/** @deprecated use `tags: [slug]` */
	tag?: string;
	search?: string;
	page?: number;
}): string {
	const p = new URLSearchParams();
	if (opts.page && opts.page > 1) p.set("page", String(opts.page));
	if (opts.search?.trim()) p.set("search", opts.search.trim());
	const fromOpts = opts.tags?.length
		? opts.tags
		: opts.tag && isBlogTagSlug(opts.tag)
			? [opts.tag]
			: [];
	const unique = [...new Set(fromOpts.filter(isBlogTagSlug))].sort();
	for (const t of unique) {
		p.append("tag", t);
	}
	const qs = p.toString();
	return qs ? `/?${qs}` : "/";
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
