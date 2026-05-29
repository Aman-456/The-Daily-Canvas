CREATE INDEX IF NOT EXISTS "comment_blog_id_idx" ON "comment" ("blogId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_parent_id_idx" ON "comment" ("parentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blog_author_id_idx" ON "blog" ("authorId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blog_published_hidden_created_idx" ON "blog" ("isPublished","isHidden","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blog_tags_gin_idx" ON "blog" USING gin ("tags");
