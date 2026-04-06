import Link from "next/link";
import Image from "next/image";
import type { BlogPostCardItem } from "@/components/client/BlogPostCardGrid";

export function RelatedPosts({ posts }: { posts: BlogPostCardItem[] }) {
	if (posts.length === 0) return null;

	return (
		<section className="pt-10 border-t space-y-4">
			<h2 className="text-lg font-bold tracking-tight">Related posts</h2>
			<p className="text-sm text-muted-foreground">
				More stories you might like, based on shared topics.
			</p>
			<ul className="grid sm:grid-cols-2 gap-4">
				{posts.map((blog) => (
					<li key={blog.slug}>
						<Link
							href={`/blogs/${blog.slug}`}
							className="group flex gap-3 rounded-xl border border-border/50 p-3 hover:border-primary/30 hover:bg-muted/30 transition-colors"
						>
							<div className="relative w-24 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
								{blog.coverImage ? (
									<Image
										src={blog.coverImage}
										alt={`${blog.title} cover image`}
										fill
										className="object-cover"
										sizes="96px"
									/>
								) : null}
							</div>
							<div className="min-w-0">
								<p className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
									{blog.title}
								</p>
								{blog.excerpt && (
									<p className="text-xs text-muted-foreground line-clamp-2 mt-1">
										{blog.excerpt}
									</p>
								)}
							</div>
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}
