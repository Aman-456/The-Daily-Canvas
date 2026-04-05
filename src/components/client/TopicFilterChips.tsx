"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	BLOG_TAGS,
	archiveListingHref,
	blogListingHref,
	hrefForActiveTags,
	isBlogTagSlug,
	listingTitleQueryFromUrlSearchParams,
	searchListingHref,
	type BlogTagSlug,
	type TopicListingBase,
} from "@/lib/blog-tags";
import { parseBlogListSort } from "@/lib/blog-list-sort";
import { TopicFilterMultiselect } from "@/components/client/TopicFilterMultiselect";

const VISIBLE_TOPIC_COUNT = 10;

export function TopicFilterChips({
	variant = "default",
	listingBase = "home",
}: {
	variant?: "default" | "editorial";
	/** Where multi-tag and “all” filters live: `/`, `/archive`, or `/search`. */
	listingBase?: TopicListingBase;
}) {
	const [expanded, setExpanded] = useState(false);
	const topicHintId = useId();
	const pathname = usePathname();
	const sp = useSearchParams();
	const search = listingTitleQueryFromUrlSearchParams(sp);
	const sort = parseBlogListSort(sp.get("sort"));

	const topicSeg = pathname.match(/^\/topics\/([^/]+)$/);
	const slugFromPath =
		topicSeg && isBlogTagSlug(topicSeg[1]) ? topicSeg[1] : null;

	const rawTags = sp.getAll("tag");
	const activeTags: BlogTagSlug[] = slugFromPath
		? [slugFromPath]
		: [...new Set(rawTags.filter(isBlogTagSlug))].sort();

	const hrefToggle = (slug: BlogTagSlug) => {
		const next = new Set<BlogTagSlug>(activeTags);
		if (next.has(slug)) next.delete(slug);
		else next.add(slug);
		return hrefForActiveTags([...next].sort(), search, listingBase, sort);
	};

	const allStoriesHref =
		listingBase === "search"
			? searchListingHref({ search, sort })
			: listingBase === "archive"
				? archiveListingHref({ search, sort })
				: blogListingHref({ search, sort });

	const mobileMultiselect = (
		<div className="md:hidden">
			<TopicFilterMultiselect
				activeTags={activeTags}
				allStoriesHref={allStoriesHref}
				listingBase={listingBase}
				search={search}
				sort={sort}
				variant={variant}
				hintId={topicHintId}
			/>
		</div>
	);

	const visibleTags = BLOG_TAGS.slice(0, VISIBLE_TOPIC_COUNT);
	const extraTags = BLOG_TAGS.slice(VISIBLE_TOPIC_COUNT);
	const hasExtra = extraTags.length > 0;

	const Chip = ({ slug, label }: { slug: BlogTagSlug; label: string }) => {
		const selected = activeTags.includes(slug);
		if (variant === "editorial") {
			return (
				<Link
					href={hrefToggle(slug)}
					className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold transition-colors ${selected
						? "bg-foreground text-background dark:bg-zinc-100 dark:text-zinc-950"
						: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
						}`}
				>
					{label}
				</Link>
			);
		}
		return (
			<Link
				href={hrefToggle(slug)}
				className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${selected
					? "border-primary bg-primary/10 text-primary"
					: "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70"
					}`}
			>
				{label}
			</Link>
		);
	};

	if (variant === "editorial") {
		return (
			<div className="w-full min-w-0">
				{mobileMultiselect}
				<div className="scrollbar-filter hidden items-center gap-2 overflow-x-auto pb-1 md:flex">
					<Link
						href={allStoriesHref}
						className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold transition-colors ${activeTags.length === 0
							? "bg-foreground text-background dark:bg-zinc-100 dark:text-zinc-950"
							: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
							}`}
					>
						All stories
					</Link>
					{BLOG_TAGS.map(({ slug, label }) => (
						<Chip key={slug} slug={slug} label={label} />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="min-w-0 space-y-2">
			{mobileMultiselect}
			<p className="hidden text-xs font-medium uppercase tracking-wide text-muted-foreground md:block">
				Browse by topic
			</p>
			<p className="hidden text-[11px] text-muted-foreground md:block">
				Select one or more topics. Posts must match every selected tag.
			</p>
			<div className="hidden flex-wrap items-center gap-2 md:flex">
				<Link
					href={allStoriesHref}
					className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${activeTags.length === 0
						? "border-primary bg-primary/10 text-primary"
						: "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70"
						}`}
				>
					All topics
				</Link>
				{visibleTags.map(({ slug, label }) => (
					<Chip key={slug} slug={slug} label={label} />
				))}
				{hasExtra && !expanded && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-8 gap-1 rounded-full text-xs"
						onClick={() => setExpanded(true)}
					>
						More topics
						<ChevronDown className="size-3.5 opacity-70" />
					</Button>
				)}
			</div>
			{hasExtra && expanded && (
				<div className="hidden flex-wrap gap-2 border-t border-border/40 pt-1 md:flex">
					{extraTags.map(({ slug, label }) => (
						<Chip key={slug} slug={slug} label={label} />
					))}
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-8 gap-1 rounded-full text-xs text-muted-foreground"
						onClick={() => setExpanded(false)}
					>
						Show fewer
						<ChevronUp className="size-3.5 opacity-70" />
					</Button>
				</div>
			)}
		</div>
	);
}

export function TopicFilterChipsFallback() {
	return (
		<div className="w-full min-w-0 space-y-2 md:space-y-0">
			<div className="space-y-2 md:hidden">
				<div className="h-3 w-16 animate-pulse rounded bg-muted/70" />
				<div className="h-11 w-full animate-pulse rounded-xl bg-muted/70" />
				<div className="h-3 w-full max-w-[240px] animate-pulse rounded bg-muted/50" />
			</div>
			<div className="scrollbar-filter hidden items-center gap-2 overflow-x-auto pb-1 md:flex">
				{Array.from({ length: 8 }).map((_, i) => (
					<div
						key={i}
						className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-muted/70"
					/>
				))}
			</div>
		</div>
	);
}
