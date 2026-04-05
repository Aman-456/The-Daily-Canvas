"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	BLOG_LIST_SORT_VALUES,
	blogListSortLabel,
	parseBlogListSort,
	type BlogListSort,
} from "@/lib/blog-list-sort";
import { cn } from "@/lib/utils";

/**
 * URL-driven sort (`?sort=`) for archive, topic, and home listing views.
 * Uses the same dropdown pattern as topic multiselect for consistent motion.
 */
export function ListingSortBar() {
	const router = useRouter();
	const pathname = usePathname();
	const sp = useSearchParams();
	const sort = parseBlogListSort(sp.get("sort"));

	const applySort = (next: BlogListSort) => {
		const p = new URLSearchParams(sp.toString());
		if (next === "newest") p.delete("sort");
		else p.set("sort", next);
		p.delete("page");
		const qs = p.toString();
		router.push(qs ? `${pathname}?${qs}` : pathname);
	};

	return (
		<div className="flex w-full min-w-0 flex-col gap-2 md:max-w-[240px]">
			<span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
				Sort by
			</span>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						aria-label="Sort posts"
						className={cn(
							"flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border/60 bg-background px-3 text-left text-sm font-medium text-foreground shadow-sm outline-none transition-colors",
							"hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-primary/25",
							"dark:bg-zinc-900/80",
						)}
					>
						<span className="min-w-0 flex-1 truncate">
							{blogListSortLabel(sort)}
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
					<DropdownMenuRadioGroup
						value={sort}
						onValueChange={(v) => applySort(parseBlogListSort(v))}
					>
						{BLOG_LIST_SORT_VALUES.map((v) => (
							<DropdownMenuRadioItem
								key={v}
								value={v}
								className="rounded-lg py-2.5 text-sm font-medium"
							>
								{blogListSortLabel(v)}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
