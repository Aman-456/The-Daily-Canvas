"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
	BLOG_TAGS,
	blogListingHref,
	hrefForActiveTags,
	isBlogTagSlug,
} from "@/lib/blog-tags";

export function TopicFilterChips() {
	const pathname = usePathname();
	const sp = useSearchParams();
	const search = sp.get("search") ?? "";

	const topicSeg = pathname.match(/^\/topics\/([^/]+)$/);
	const slugFromPath =
		topicSeg && isBlogTagSlug(topicSeg[1]) ? topicSeg[1] : null;

	const rawTags = sp.getAll("tag");
	const activeTags = slugFromPath
		? [slugFromPath]
		: [...new Set(rawTags.filter(isBlogTagSlug))].sort();

	const hrefToggle = (slug: string) => {
		const next = new Set<string>(activeTags);
		if (next.has(slug)) next.delete(slug);
		else next.add(slug);
		return hrefForActiveTags([...next].sort(), search);
	};

	return (
		<div className="space-y-2">
			<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
				Browse by topic
			</p>
			<p className="text-[11px] text-muted-foreground">
				Select one or more topics. Posts must match every selected tag.
			</p>
			<div className="flex flex-wrap gap-2">
				<Link
					href={blogListingHref({ search })}
					className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${activeTags.length === 0
						? "border-primary bg-primary/10 text-primary"
						: "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70"
						}`}
				>
					All topics
				</Link>
				{BLOG_TAGS.map(({ slug, label }) => {
					const selected = activeTags.includes(slug);
					return (
						<Link
							key={slug}
							href={hrefToggle(slug)}
							className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${selected
								? "border-primary bg-primary/10 text-primary"
								: "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70"
								}`}
						>
							{label}
						</Link>
					);
				})}
			</div>
		</div>
	);
}

export function TopicFilterChipsFallback() {
	return (
		<div className="space-y-2">
			<div className="h-3 w-28 rounded bg-muted/80 animate-pulse" />
			<div className="h-3 w-full max-w-md rounded bg-muted/60 animate-pulse" />
			<div className="flex flex-wrap gap-2">
				{Array.from({ length: 8 }).map((_, i) => (
					<div
						key={i}
						className="h-8 w-20 rounded-full bg-muted/70 animate-pulse"
					/>
				))}
			</div>
		</div>
	);
}
