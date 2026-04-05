"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
	BLOG_LIST_SORT_VALUES,
	blogListSortLabel,
	parseBlogListSort,
} from "@/lib/blog-list-sort";

/**
 * URL-driven sort (`?sort=`) for archive, topic, and home listing views.
 */
export function ListingSortBar() {
	const router = useRouter();
	const pathname = usePathname();
	const sp = useSearchParams();
	const sort = parseBlogListSort(sp.get("sort"));

	const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const next = e.target.value;
		const p = new URLSearchParams(sp.toString());
		if (next === "newest") p.delete("sort");
		else p.set("sort", next);
		p.delete("page");
		const qs = p.toString();
		router.push(qs ? `${pathname}?${qs}` : pathname);
	};

	return (
		<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
			<span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground whitespace-nowrap">
				Sort by
			</span>
			<select
				value={sort}
				onChange={onChange}
				aria-label="Sort posts"
				className="h-10 max-w-[220px] rounded-xl border border-border/60 bg-background px-3 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/25 dark:bg-zinc-900/80"
			>
				{BLOG_LIST_SORT_VALUES.map((v) => (
					<option key={v} value={v}>
						{blogListSortLabel(v)}
					</option>
				))}
			</select>
		</div>
	);
}
