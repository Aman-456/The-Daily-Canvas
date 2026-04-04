import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	blogTagFilterHref,
	blogTagLabel,
	blogTagSlugForLink,
} from "@/lib/blog-tags";

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

function calculateReadTime(content: string) {
	const wordsPerMinute = 200;
	const words = content?.trim().split(/\s+/).length;
	return Math.ceil(words / wordsPerMinute);
}

export function BlogPostCardGrid({ blogs }: { blogs: BlogPostCardItem[] }) {
	return (
		<div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
			{blogs.map((blog) => {
				const readTime = calculateReadTime(blog.content);
				return (
					<article
						key={blog.slug}
						className="h-full group rounded-xl border border-border/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm overflow-hidden hover:shadow-lg hover:border-border transition-all duration-300 flex flex-col"
					>
						<Link href={`/blogs/${blog.slug}`} className="block flex-1">
							<div className="aspect-16/10 bg-muted relative overflow-hidden">
								{blog.coverImage ? (
									<Image
										src={blog.coverImage}
										alt={blog.title}
										fill
										sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
										className="object-cover group-hover:scale-105 transition-transform duration-500"
									/>
								) : (
									<div className="w-full h-full bg-linear-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 transition-transform duration-500 group-hover:scale-105" />
								)}
							</div>

							<div className="p-4 space-y-2.5">
								<h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
									{blog.title}
								</h3>

								<p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
									{blog.excerpt || blog.content.substring(0, 120) + "..."}
								</p>
							</div>
						</Link>

						{(blog.tags?.length ?? 0) > 0 && (
							<div className="px-4 pb-2 flex flex-wrap gap-1.5">
								{(blog.tags ?? []).slice(0, 4).map((tag: string) => {
									const label = blogTagLabel(tag);
									const slugForFilter = blogTagSlugForLink(tag);
									if (slugForFilter) {
										return (
											<Link
												key={tag}
												href={blogTagFilterHref(slugForFilter)}
												className="text-[11px] font-medium text-primary/80 bg-primary/8 px-2 py-0.5 rounded-full hover:bg-primary/15 transition-colors"
											>
												{label}
											</Link>
										);
									}
									return (
										<span
											key={tag}
											className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full"
										>
											{label}
										</span>
									);
								})}
							</div>
						)}

						<div className="px-4 pb-3.5 pt-1 flex items-center justify-between border-t border-border/40 mt-auto">
							<div className="flex items-center gap-2">
								<Avatar className="h-7 w-7 border">
									<AvatarImage src={blog.authorId?.image || undefined} />
									<AvatarFallback className="text-[10px]">
										{blog.authorId?.name?.charAt(0) || "U"}
									</AvatarFallback>
								</Avatar>
								<div className="text-[11px] leading-tight">
									<p className="font-medium text-foreground">
										{blog.authorId?.name}
									</p>
									<p className="text-muted-foreground">
										{new Date(blog.createdAt).toLocaleDateString()}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
								<span className="flex items-center gap-1">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										className="w-3.5 h-3.5"
									>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
											clipRule="evenodd"
										/>
									</svg>
									{readTime} min
								</span>
								<span className="flex items-center gap-1">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										className="w-3.5 h-3.5"
									>
										<path
											fillRule="evenodd"
											d="M2 5a3 3 0 013-3h10a3 3 0 013 3v6a3 3 0 01-3 3h-1.586l-2.707 2.707a1 1 0 01-1.414 0L6.586 14H5a3 3 0 01-3-3V5zm3-1a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 01.707.293L10 14.586l2.293-2.293A1 1 0 0113 12h2a1 1 0 001-1V5a1 1 0 00-1-1H5z"
											clipRule="evenodd"
										/>
									</svg>
									{blog.commentsCount || 0}
								</span>
							</div>
						</div>
					</article>
				);
			})}
		</div>
	);
}
