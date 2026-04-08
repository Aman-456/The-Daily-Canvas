import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import type { BlogPostCardItem } from "@/components/client/BlogPostCardGrid";

const BENTO_MAX = 5;

type CardVariant = "hero" | "tile" | "rail";

function excerptFor(blog: BlogPostCardItem) {
	if (blog.excerpt?.trim()) return blog.excerpt;
	const t = blog.content?.trim().slice(0, 140);
	return t ? `${t}…` : "";
}

function SpotlightCard({
	blog,
	variant,
	className = "",
}: {
	blog: BlogPostCardItem;
	variant: CardVariant;
	className?: string;
}) {
	const excerpt = excerptFor(blog);
	const titleClass =
		variant === "hero"
			? "text-xl sm:text-2xl lg:text-[1.65rem] font-bold leading-snug line-clamp-3 group-hover:text-primary transition-colors"
			: variant === "tile"
				? "text-sm sm:text-[15px] font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors"
				: "text-[15px] font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors";

	const aspectClass =
		variant === "hero"
			? "relative aspect-[16/11] lg:aspect-auto lg:min-h-[220px] lg:flex-1"
			: "relative aspect-[16/10] lg:aspect-auto lg:min-h-[100px] lg:flex-1";

	const padClass = variant === "hero" ? "p-4 sm:p-5 lg:p-6" : "p-3 sm:p-3.5";

	return (
		<Link
			href={`/blogs/${blog.slug}`}
			className={`group flex flex-col rounded-2xl border border-border/60 bg-linear-to-b from-muted/50 to-muted/15 dark:from-muted/25 dark:to-muted/5 overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 min-h-0 min-w-0 ${className}`}
		>
			<div className={`${aspectClass} bg-muted shrink-0`}>
				{blog.coverImage ? (
					variant === "hero" ? (
						<Image
							src={blog.coverImage}
							alt={`${blog.title} cover image`}
							fill
							priority
							className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
							sizes="(max-width: 768px) 100vw, 42vw"
						/>
					) : (
						<Image
							src={blog.coverImage}
							alt={`${blog.title} cover image`}
							fill
							quality={65}
							loading="lazy"
							className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
							sizes="(max-width: 768px) 100vw, 22vw"
						/>
					)
				) : (
					<div className="absolute inset-0 bg-linear-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900" />
				)}
			</div>
			<div className={`${padClass} flex flex-col gap-2 min-h-0 ${variant === "hero" ? "lg:justify-end" : ""}`}>
				<h3 className={titleClass}>{blog.title}</h3>
				{excerpt && variant === "hero" && (
					<p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed hidden sm:block">
						{excerpt}
					</p>
				)}
				{excerpt && variant === "tile" && (
					<p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
						{excerpt}
					</p>
				)}
				<p className="text-[11px] text-muted-foreground mt-auto pt-1">
					{blog.commentsCount
						? `${blog.commentsCount} comments`
						: "Join the discussion"}
				</p>
			</div>
		</Link>
	);
}

/**
 * Desktop-only: strict 50% | 50% columns (equal `fr`).
 * 1 → full width. 2 → 50% | 50%, equal height. 3 → left one card spans full height, right two stacked.
 * 4 → two stacked left, two stacked right. 5 → three stacked left, two stacked right.
 */
function BentoGrid({ items }: { items: BlogPostCardItem[] }) {
	const n = items.length;
	if (n === 0) return null;

	const gap = "gap-4";
	const shell = `grid ${gap} min-h-0 w-full`;

	if (n === 1) {
		return (
			<div className={`${shell} grid-cols-1 min-h-[380px] lg:min-h-[460px]`}>
				<SpotlightCard
					blog={items[0]}
					variant="hero"
					className="h-full min-h-[380px] lg:min-h-[460px]"
				/>
			</div>
		);
	}

	if (n === 2) {
		return (
			<div
				className={`${shell} grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-h-[400px] lg:min-h-[460px]`}
			>
				<SpotlightCard blog={items[0]} variant="hero" className="h-full min-h-0" />
				<SpotlightCard blog={items[1]} variant="hero" className="h-full min-h-0" />
			</div>
		);
	}

	if (n === 3) {
		return (
			<div
				className={`${shell} grid-cols-[minmax(0,1fr)_minmax(0,1fr)] grid-rows-2 min-h-[420px] lg:min-h-[480px]`}
			>
				<SpotlightCard
					blog={items[0]}
					variant="hero"
					className="row-span-2 h-full min-h-0"
				/>
				<SpotlightCard blog={items[1]} variant="tile" className="h-full min-h-0" />
				<SpotlightCard blog={items[2]} variant="tile" className="h-full min-h-0" />
			</div>
		);
	}

	if (n === 4) {
		// Same column rule as 3 & 5: left 50% filled top→bottom, then right top→bottom
		return (
			<div
				className={`${shell} grid-cols-[minmax(0,1fr)_minmax(0,1fr)] grid-rows-2 min-h-[440px] lg:min-h-[500px]`}
			>
				<SpotlightCard
					blog={items[0]}
					variant="tile"
					className="col-start-1 row-start-1 h-full min-h-0"
				/>
				<SpotlightCard
					blog={items[1]}
					variant="tile"
					className="col-start-1 row-start-2 h-full min-h-0"
				/>
				<SpotlightCard
					blog={items[2]}
					variant="tile"
					className="col-start-2 row-start-1 h-full min-h-0"
				/>
				<SpotlightCard
					blog={items[3]}
					variant="tile"
					className="col-start-2 row-start-2 h-full min-h-0"
				/>
			</div>
		);
	}

	// n === 5 — left 50%: three stacked; right 50%: two stacked (row 3 col 2 empty)
	return (
		<div
			className={`${shell} grid-cols-[minmax(0,1fr)_minmax(0,1fr)] grid-rows-3 min-h-[520px] lg:min-h-[580px]`}
		>
			<SpotlightCard
				blog={items[0]}
				variant="tile"
				className="col-start-1 row-start-1 h-full min-h-0"
			/>
			<SpotlightCard
				blog={items[1]}
				variant="tile"
				className="col-start-1 row-start-2 h-full min-h-0"
			/>
			<SpotlightCard
				blog={items[2]}
				variant="tile"
				className="col-start-1 row-start-3 h-full min-h-0"
			/>
			<SpotlightCard
				blog={items[3]}
				variant="tile"
				className="col-start-2 row-start-1 h-full min-h-0"
			/>
			<SpotlightCard
				blog={items[4]}
				variant="tile"
				className="col-start-2 row-start-2 h-full min-h-0"
			/>
		</div>
	);
}

function MobileCarousel({ items }: { items: BlogPostCardItem[] }) {
	return (
		<div className="md:hidden flex gap-4 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory scroll-pl-4 -mx-4 px-4 scroll-smooth [scrollbar-width:thin]">
			{items.map((blog) => (
				<div
					key={blog.slug}
					className="snap-start shrink-0 w-[min(92vw,24rem)] first:pl-0"
				>
					<SpotlightCard blog={blog} variant="rail" className="h-full min-h-[320px]" />
				</div>
			))}
		</div>
	);
}

function MoreCarousel({ items }: { items: BlogPostCardItem[] }) {
	if (items.length === 0) return null;
	return (
		<div className="mt-6 space-y-3">
			<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
				More picks
			</p>
			<div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-pl-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:scroll-pl-0 scroll-smooth [scrollbar-width:thin]">
				{items.map((blog) => (
					<div
						key={blog.slug}
						className="snap-start shrink-0 w-[min(88vw,20rem)] sm:w-[19rem]"
					>
						<SpotlightCard blog={blog} variant="rail" className="h-full min-h-[280px]" />
					</div>
				))}
			</div>
		</div>
	);
}

export function SpotlightCarousel({ items }: { items: BlogPostCardItem[] }) {
	if (items.length === 0) return null;

	const bentoItems = items.slice(0, BENTO_MAX);
	const overflow = items.slice(BENTO_MAX);

	return (
		<section className="pb-6 border-b border-border/40">
			<div className="flex items-center gap-2 mb-4 md:mb-5">
				<Sparkles className="size-5 text-amber-500 shrink-0" aria-hidden />
				<div>
					<h2 className="text-base md:text-lg font-bold tracking-tight text-foreground">
						Featured &amp; trending
					</h2>
					<p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
						Picks from the community — layout adapts to how many stories are in
						the strip; criteria can be refined later.
					</p>
				</div>
			</div>

			<div className="hidden md:block">
				<BentoGrid items={bentoItems} />
			</div>
			<MobileCarousel items={items} />

			{overflow.length > 0 && (
				<div className="hidden md:block">
					<MoreCarousel items={overflow} />
				</div>
			)}
		</section>
	);
}
