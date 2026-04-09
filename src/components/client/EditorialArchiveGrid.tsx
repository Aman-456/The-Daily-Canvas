import Link from "next/link";
import Image from "next/image";
import { Eye } from "lucide-react";
import type { BlogPostCardItem } from "@/types/blog-post-card";
import { cn } from "@/lib/utils";
import {
	blogTagFilterHref,
	blogTagLabel,
	blogTagSlugForLink,
} from "@/lib/blog-tags";

function readMinutes(content: string) {
	const words = content?.trim().split(/\s+/).filter(Boolean).length ?? 0;
	return Math.max(1, Math.ceil(words / 200));
}

export function EditorialArchiveGrid({
	blogs,
	className,
}: {
	blogs: BlogPostCardItem[];
	className?: string;
}) {
	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-3",
				className,
			)}
		>
			{blogs.map((blog) => {
				const primaryTag = blog.tags?.[0];
				const tagLabel = primaryTag ? blogTagLabel(primaryTag) : "Story";
				const slugForFilter = primaryTag
					? blogTagSlugForLink(primaryTag)
					: null;
				const mins = readMinutes(blog.content);
				const date = new Date(blog.createdAt).toLocaleDateString(undefined, {
					month: "long",
					day: "numeric",
					year: "numeric",
				});

				return (
					<article key={blog.slug} className="group">
						<div className="editorial-card-shadow relative mb-5 aspect-[16/10] overflow-hidden rounded-2xl">
							<Link
								href={`/blogs/${blog.slug}`}
								className="absolute inset-0 z-0 block"
								aria-label={blog.title}
							>
								{blog.coverImage ? (
									<Image
										src={blog.coverImage}
										alt={`${blog.title} cover image`}
										fill
										quality={65}
										loading="lazy"
										className="object-cover transition-transform duration-700 group-hover:scale-105"
										sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
									/>
								) : (
									<div className="absolute inset-0 bg-linear-to-br from-zinc-200 to-zinc-400 dark:from-zinc-800 dark:to-zinc-950" />
								)}
							</Link>
							{slugForFilter ? (
								<Link
									href={blogTagFilterHref(slugForFilter)}
									aria-label={`Filter posts by topic: ${tagLabel}`}
									className="absolute left-4 top-4 z-10 inline-flex min-h-11 items-center rounded-full bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-white dark:bg-zinc-950/90 dark:text-zinc-100 dark:hover:bg-zinc-900"
								>
									{tagLabel}
								</Link>
							) : (
								<span className="absolute left-4 top-4 z-10 inline-flex min-h-11 items-center rounded-full bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-900 backdrop-blur-sm dark:bg-zinc-950/90 dark:text-zinc-100">
									{tagLabel}
								</span>
							)}
						</div>
						<Link href={`/blogs/${blog.slug}`} className="block space-y-3">
							<div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
								<span>{date}</span>
								<span className="size-1 rounded-full bg-border" />
								<span>{mins} min read</span>
								<span className="ml-auto inline-flex items-center gap-1 opacity-80">
									<Eye className="size-3.5" aria-hidden />
									{blog.commentsCount ?? 0}
								</span>
							</div>
							<h3 className="font-headline text-base font-semibold leading-snug transition-colors group-hover:text-primary md:text-lg">
								{blog.title}
							</h3>
							<p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
								{blog.excerpt?.trim() ||
									`${blog.content.trim().slice(0, 140)}…`}
							</p>
						</Link>
					</article>
				);
			})}
		</div>
	);
}
