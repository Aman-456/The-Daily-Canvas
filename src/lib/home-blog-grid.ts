const ALLOWED_SIZES = new Set([6, 9, 12]);
const TEASER_SIZES = new Set([6, 9]);

/**
 * How many archive cards show on the **home** page before “Show more” (6 or 9).
 * Full listings use `/archive`. Set `NEXT_PUBLIC_HOME_ARCHIVE_TEASER` to 6 or 9.
 */
export function homeArchiveTeaserCount(): number {
	const raw = process.env.NEXT_PUBLIC_HOME_ARCHIVE_TEASER;
	const n = raw ? Number(raw) : 9;
	if (TEASER_SIZES.has(n)) return n;
	return 9;
}

/**
 * Page size on `/archive` when not filtering (also used for filtered archive limit
 * pairing). Set `NEXT_PUBLIC_HOME_BLOG_GRID_SIZE` to 6, 9, or 12.
 */
export function homeBlogGridPageSize(): number {
	const raw = process.env.NEXT_PUBLIC_HOME_BLOG_GRID_SIZE;
	const n = raw ? Number(raw) : 12;
	if (ALLOWED_SIZES.has(n)) return n;
	return 12;
}
