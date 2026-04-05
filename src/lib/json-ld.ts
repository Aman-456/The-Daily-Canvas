/**
 * Shared Schema.org JSON-LD builders. Site-wide graph (Organization, WebSite, SearchAction)
 * is emitted from the client layout; pages add WebPage / CollectionPage / BreadcrumbList as needed.
 */

export const SITE_NAME = "Daily Thoughts";
export const SITE_ALTERNATE_NAME = "The Daily Thoughts";

export function siteBaseUrl(): string {
	return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
	const base = siteBaseUrl();
	if (!path) return base;
	if (path.startsWith("http://") || path.startsWith("https://")) return path;
	return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function organizationJsonLd(): Record<string, unknown> {
	const base = siteBaseUrl();
	return {
		"@type": "Organization",
		"@id": `${base}/#organization`,
		name: SITE_NAME,
		alternateName: SITE_ALTERNATE_NAME,
		url: base,
	};
}

/** Used by WebSite and documented for sitelinks / search fields (header + /search hero). */
export function searchActionJsonLd(): Record<string, unknown> {
	const base = siteBaseUrl();
	return {
		"@type": "SearchAction",
		target: {
			"@type": "EntryPoint",
			urlTemplate: `${base}/search?query={search_term_string}`,
		},
		"query-input": "required name=search_term_string",
	};
}

export function websiteJsonLd(): Record<string, unknown> {
	const base = siteBaseUrl();
	return {
		"@type": "WebSite",
		"@id": `${base}/#website`,
		name: SITE_NAME,
		alternateName: SITE_ALTERNATE_NAME,
		url: base,
		inLanguage: "en",
		publisher: { "@id": `${base}/#organization` },
		potentialAction: searchActionJsonLd(),
	};
}

/** Organization + WebSite + SearchAction (search bar / sitelinks). */
export function sitewideJsonLdGraph(): Record<string, unknown> {
	return {
		"@context": "https://schema.org",
		"@graph": [organizationJsonLd(), websiteJsonLd()],
	};
}

export function breadcrumbListJsonLd(
	items: { name: string; item: string }[],
): Record<string, unknown> {
	return {
		"@type": "BreadcrumbList",
		itemListElement: items.map((row, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: row.name,
			item: absoluteUrl(row.item),
		})),
	};
}

export function webPageJsonLd(opts: {
	name: string;
	description?: string;
	path: string;
	type?:
		| "WebPage"
		| "AboutPage"
		| "CollectionPage"
		| "SearchResultsPage"
		| "ContactPage";
	/** e.g. SearchAction for the /search hub (documents in-page search). */
	potentialAction?: Record<string, unknown>;
}): Record<string, unknown> {
	const base = siteBaseUrl();
	const url = absoluteUrl(opts.path);
	return {
		"@type": opts.type ?? "WebPage",
		"@id": `${url}#webpage`,
		name: opts.name,
		...(opts.description ? { description: opts.description } : {}),
		url,
		isPartOf: { "@id": `${base}/#website` },
		publisher: { "@id": `${base}/#organization` },
		...(opts.potentialAction
			? { potentialAction: opts.potentialAction }
			: {}),
	};
}

export function jsonLdGraph(nodes: Record<string, unknown>[]): Record<string, unknown> {
	return {
		"@context": "https://schema.org",
		"@graph": nodes,
	};
}
