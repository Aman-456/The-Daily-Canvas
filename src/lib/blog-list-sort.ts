export const BLOG_LIST_SORT_VALUES = [
	"newest",
	"oldest",
	"most-commented",
	"title",
] as const;

export type BlogListSort = (typeof BLOG_LIST_SORT_VALUES)[number];

export function parseBlogListSort(
	raw: string | null | undefined | BlogListSort,
): BlogListSort {
	if (raw === "oldest" || raw === "most-commented" || raw === "title") {
		return raw;
	}
	return "newest";
}

export function blogListSortLabel(s: BlogListSort): string {
	switch (s) {
		case "oldest":
			return "Oldest first";
		case "most-commented":
			return "Most discussed";
		case "title":
			return "Title A–Z";
		default:
			return "Newest first";
	}
}

export function parseSortFromSearchParams(params: {
	[key: string]: string | string[] | undefined;
}): BlogListSort {
	const raw = params.sort;
	const s =
		typeof raw === "string"
			? raw
			: Array.isArray(raw) && typeof raw[0] === "string"
				? raw[0]
				: undefined;
	return parseBlogListSort(s);
}
