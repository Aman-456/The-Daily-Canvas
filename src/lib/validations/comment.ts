import { z } from "zod";

export const commentSchema = z.object({
	content: z
		.string()
		.min(1, "Comment content is required")
		.max(1000, "Comment is too long"),
	blogId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid blog ID"),
	slug: z.string().nullish(),
	parentId: z
		.string()
		.regex(/^[0-9a-fA-F]{24}$/, "Invalid parent ID")
		.nullish()
		.or(z.literal("")),
});

export type CommentInput = z.infer<typeof commentSchema>;
