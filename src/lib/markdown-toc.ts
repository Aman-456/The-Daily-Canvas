import slugify from "slugify";

export type TocItem = { id: string; text: string; level: 2 | 3 };

function makeUniqueId(base: string, used: Set<string>): string {
	let id = base || "section";
	let candidate = id;
	let n = 0;
	while (used.has(candidate)) {
		n += 1;
		candidate = `${id}-${n}`;
	}
	used.add(candidate);
	return candidate;
}

/** Parse ## / ### lines from markdown source for TOC and heading ids. */
export function extractTocFromMarkdown(markdown: string): TocItem[] {
	const items: TocItem[] = [];
	const used = new Set<string>();
	for (const line of markdown.split("\n")) {
		const trimmed = line.trim();
		const m = /^(#{2,3})\s+(.+)$/.exec(trimmed);
		if (!m) continue;
		const level = m[1].length as 2 | 3;
		let text = m[2].replace(/\s+#+\s*$/, "").trim();
		text = text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
		if (!text) continue;
		const base = slugify(text, { lower: true, strict: true, trim: true });
		const id = makeUniqueId(base || `h${level}`, used);
		items.push({ id, text, level });
	}
	return items;
}
