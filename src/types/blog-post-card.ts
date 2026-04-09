export type BlogPostCardItem = {
	slug: string;
	title: string;
	content: string;
	excerpt: string | null;
	coverImage: string | null;
	tags: string[] | null;
	commentsCount: number | null;
	createdAt: Date;
	authorId: { name: string | null; image: string | null } | null;
};
