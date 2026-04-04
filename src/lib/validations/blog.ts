import { z } from "zod";
import { normalizeBlogTagSlugs } from "@/lib/blog-tags";

export const getKeywordsArray = (keywordsString: string | null | undefined) => {
	if (!keywordsString) return [];
	return keywordsString
		.split(",")
		.map((k) => k.trim())
		.filter(Boolean);
};

/** Single field → string; repeated `name="keywords"` → string[]. */
export function keywordsFromFormData(formData: FormData): string | string[] {
	const entries = formData
		.getAll("keywords")
		.filter((v): v is string => typeof v === "string");
	if (entries.length === 0) return "";
	if (entries.length === 1) return entries[0];
	return entries;
}

/** Same shape as keywords; used for `name="tags"`. */
export function tagsFromFormData(formData: FormData): string | string[] {
	const entries = formData
		.getAll("tags")
		.filter((v): v is string => typeof v === "string");
	if (entries.length === 0) return "";
	if (entries.length === 1) return entries[0];
	return entries;
}

/** Accepts comma-separated string, list of strings, or empty; always returns trimmed unique-ish tokens. */
export const normalizeKeywordsInput = (val: unknown): string[] => {
	if (val === null || val === undefined) return [];
	if (Array.isArray(val)) {
		return val
			.filter((item): item is string => typeof item === "string")
			.flatMap((item) => getKeywordsArray(item));
	}
	if (typeof val === "string") return getKeywordsArray(val);
	return [];
};

export const blogSchema = z.object({
	title: z.string().min(1, "Title is required").max(100, "Title is too long"),
	content: z.string().min(1, "Content is required"),
	excerpt: z.string().max(300, "Excerpt is too long").nullish(),
	coverImage: z.string().url("Invalid image URL").nullish().or(z.literal("")),
	isPublished: z.boolean().default(false),
	metaTitle: z.string().max(60, "Meta title is too long").nullish(),
	metaDescription: z
		.string()
		.max(160, "Meta description is too long")
		.nullish(),
	keywords: z
		.union([z.string(), z.array(z.string())])
		.optional()
		.transform((val) => normalizeKeywordsInput(val)),
	tags: z
		.union([z.string(), z.array(z.string())])
		.optional()
		.transform((val) => normalizeBlogTagSlugs(val)),
});

export type BlogInput = z.infer<typeof blogSchema>;
