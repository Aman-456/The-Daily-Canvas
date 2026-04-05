"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	BLOG_TAGS,
	blogTagLabel,
	hrefForActiveTags,
	isBlogTagSlug,
	type BlogTagSlug,
	type TopicListingBase,
} from "@/lib/blog-tags";
import type { BlogListSort } from "@/lib/blog-list-sort";
import { cn } from "@/lib/utils";

function triggerSummary(
	activeTags: BlogTagSlug[],
	variant: "editorial" | "default",
): string {
	if (activeTags.length === 0) {
		return variant === "editorial" ? "All stories" : "All topics";
	}
	const labels = activeTags.map((s) => blogTagLabel(s));
	if (labels.length <= 2) return labels.join(", ");
	return `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
}

export function TopicFilterMultiselect({
	activeTags,
	allStoriesHref,
	listingBase,
	search,
	sort,
	variant,
	hintId,
}: {
	activeTags: BlogTagSlug[];
	allStoriesHref: string;
	listingBase: TopicListingBase;
	search: string;
	sort: BlogListSort;
	variant: "editorial" | "default";
	hintId?: string;
}) {
	const router = useRouter();

	const pushTags = (next: BlogTagSlug[]) => {
		const unique = [...new Set(next.filter(isBlogTagSlug))].sort();
		router.push(hrefForActiveTags(unique, search, listingBase, sort));
	};

	const toggle = (slug: BlogTagSlug, checked: boolean) => {
		const set = new Set(activeTags);
		if (checked) set.add(slug);
		else set.delete(slug);
		pushTags([...set]);
	};

	const clearAll = () => {
		router.push(allStoriesHref);
	};

	return (
		<div className="space-y-2">
			<p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
				Topics
			</p>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						aria-describedby={hintId}
						aria-label="Choose topics to filter posts"
						className={cn(
							"flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border/60 bg-background px-3 text-left text-sm font-medium text-foreground shadow-sm outline-none transition-colors",
							"hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-primary/25",
							"dark:bg-zinc-900/80",
						)}
					>
						<span className="min-w-0 flex-1 truncate">
							{triggerSummary(activeTags, variant)}
						</span>
						<ChevronDown
							className="size-4 shrink-0 text-muted-foreground opacity-70"
							aria-hidden
						/>
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="start"
					sideOffset={6}
					collisionPadding={12}
					className="max-h-[min(22rem,var(--radix-dropdown-menu-content-available-height))] min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[min(calc(100vw-2rem),24rem)] overflow-y-auto rounded-xl border p-1 shadow-lg duration-200 ease-out"
				>
					<DropdownMenuLabel className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
						Choose topics
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{BLOG_TAGS.map(({ slug, label }) => (
						<DropdownMenuCheckboxItem
							key={slug}
							checked={activeTags.includes(slug)}
							onCheckedChange={(checked) => toggle(slug, checked === true)}
							onSelect={(e) => e.preventDefault()}
							className="rounded-lg py-2.5 text-sm font-medium"
						>
							{label}
						</DropdownMenuCheckboxItem>
					))}
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="rounded-lg font-semibold text-primary focus:text-primary"
						onSelect={(e) => {
							e.preventDefault();
							clearAll();
						}}
					>
						{variant === "editorial" ? "All stories" : "Clear all topics"}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<p
				id={hintId}
				className="text-xs leading-relaxed text-muted-foreground"
			>
				Open the menu to select one or more topics. Posts must match{" "}
				<span className="font-medium text-foreground">every</span> topic you
				choose.
			</p>
		</div>
	);
}
