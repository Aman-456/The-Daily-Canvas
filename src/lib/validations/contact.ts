import { z } from "zod";

export const contactFormSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(120, "Name is too long"),
	email: z.string().trim().email("Enter a valid email").max(254),
	message: z
		.string()
		.trim()
		.min(10, "Please write at least a few words")
		.max(5000, "Message is too long"),
});
