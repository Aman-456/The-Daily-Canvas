import { blogs, users } from "./schema";

export const userMinimalSelector = {
  id: users.id,
  name: users.name,
  username: users.username,
  image: users.image,
};

export const blogSummarySelector = {
  id: blogs.id,
  title: blogs.title,
  slug: blogs.slug,
  excerpt: blogs.excerpt,
  coverImage: blogs.coverImage,
  createdAt: blogs.createdAt,
  content: blogs.content,
  tags: blogs.tags,
  commentsCount: blogs.commentsCount,
  authorId: userMinimalSelector,
};

export const blogFullSelector = {
  ...blogSummarySelector,
  isPublished: blogs.isPublished,
  updatedAt: blogs.updatedAt,
  tags: blogs.tags,
  metaTitle: blogs.metaTitle,
  metaDescription: blogs.metaDescription,
  keywords: blogs.keywords,
  authorId: userMinimalSelector,

};
