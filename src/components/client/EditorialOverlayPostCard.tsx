import Link from "next/link";
import Image from "next/image";
import { Flame, Sparkles } from "lucide-react";
import type { BlogPostCardItem } from "@/components/client/BlogPostCardGrid";
import { blogTagLabel } from "@/lib/blog-tags";

function byline(blog: BlogPostCardItem) {
	const name = blog.authorId?.name?.trim() || "Editorial";
	const d = new Date(blog.createdAt).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	return `${name} · ${d}`;
}

export type EditorialOverlaySize = "hero" | "medium" | "small" | "grid";

const minHeightClass: Record<EditorialOverlaySize, string> = {
	hero: "min-h-[240px] sm:min-h-[300px] lg:min-h-[360px]",
	medium: "min-h-[160px] sm:min-h-[180px] lg:min-h-[200px]",
	small: "min-h-[140px] lg:min-h-[160px]",
	grid: "min-h-[180px] sm:min-h-[200px] lg:min-h-[220px]",
};

/**
 * Full-bleed image card with gradient, glass badges (topic + engagement), title and byline.
 * Used in the home featured mosaic and archive/topic grids.
 */
export function EditorialOverlayPostCard({
	blog,
	size,
	className = "",
}: {
	blog: BlogPostCardItem;
	size: EditorialOverlaySize;
	className?: string;
}) {
	const tag = blog.tags?.[0];
	const label = tag ? blogTagLabel(tag) : "Story";

	const titleClass =
		size === "hero"
			? "text-xl sm:text-2xl md:text-3xl"
			: size === "medium"
				? "text-lg sm:text-xl"
				: size === "grid"
					? "text-base sm:text-lg line-clamp-2"
					: "text-sm sm:text-base line-clamp-2";

	const padClass =
		size === "hero"
			? "p-5 sm:p-6"
			: size === "medium" || size === "grid"
				? "p-4 sm:p-5"
				: "p-3 sm:p-4";

	const imageSizes =
		size === "hero"
			? "(max-width: 1024px) 100vw, 50vw"
			: "(max-width: 1024px) 100vw, 33vw";

	return (
		<Link
			href={`/blogs/${blog.slug}`}
			className={`group editorial-card-shadow relative block overflow-hidden rounded-xl bg-muted ${minHeightClass[size]} ${className}`}
		>
			{blog.coverImage ? (
				<Image
					src={blog.coverImage}
					alt=""
					fill
					className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
					sizes={imageSizes}
				/>
			) : (
				<div className="absolute inset-0 bg-linear-to-br from-zinc-300 to-zinc-400 dark:from-zinc-700 dark:to-zinc-900" />
			)}
			<div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" />
			<div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2 sm:left-4 sm:right-4 sm:top-4">
				<span className="editorial-glass-badge">
					<Sparkles className="size-3 shrink-0 opacity-90" aria-hidden />
					<span className="tracking-wide">{label.toUpperCase()}</span>
				</span>
				<span className="editorial-glass-badge">
					<Flame className="size-3 shrink-0 opacity-90" aria-hidden />
					<span>{blog.commentsCount ?? 0}</span>
				</span>
			</div>
			<div
				className={`absolute bottom-0 left-0 w-full space-y-2 text-white ${padClass}`}
			>
				<h2
					className={`font-headline font-bold leading-tight tracking-tight ${titleClass}`}
				>
					{blog.title}
				</h2>
				<p className="text-[10px] font-semibold text-white/90 sm:text-xs">
					{byline(blog)}
				</p>
			</div>
		</Link>
	);
}
