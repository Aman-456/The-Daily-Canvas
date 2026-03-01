import { z } from "zod";

export const getKeywordsArray = (keywordsString: string | null | undefined) => {
	if (!keywordsString) return [];
	return keywordsString
		.split(",")
		.map((k) => k.trim())
		.filter(Boolean);
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
		.string()
		.optional()
		.transform((val) => getKeywordsArray(val)),
});

export type BlogInput = z.infer<typeof blogSchema>;
