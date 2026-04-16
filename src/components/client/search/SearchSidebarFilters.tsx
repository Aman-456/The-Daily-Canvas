"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SearchInput from "@/components/client/SearchInput";
import { BLOG_TAGS, isBlogTagSlug } from "@/lib/blog-tags";
import { cn } from "@/lib/utils";

type AuthorOption = {
	username: string;
	name: string | null;
	articleCount: number;
};

function setParamsAndPush(
	router: ReturnType<typeof useRouter>,
	pathname: string,
	sp: URLSearchParams,
	mutate: (p: URLSearchParams) => void,
) {
	const p = new URLSearchParams(sp.toString());
	mutate(p);
	const qs = p.toString();
	router.push(qs ? `${pathname}?${qs}` : pathname);
}

export function SearchSidebarFilters({ authors }: { authors: AuthorOption[] }) {
	const router = useRouter();
	const pathname = usePathname();
	const sp = useSearchParams();

	const query = sp.get("query")?.trim() ?? "";
	const hasQuery = Boolean(query);

	const selectedAuthor = sp.get("author")?.trim().toLowerCase() ?? "";
	const excludeTags = sp.getAll("excludeTag").filter(isBlogTagSlug);
	const excludeSet = useMemo(() => new Set(excludeTags), [excludeTags]);

	const [authorOpen, setAuthorOpen] = useState(false);
	const [authorFilter, setAuthorFilter] = useState("");

	const filteredAuthors = useMemo(() => {
		const q = authorFilter.trim().toLowerCase();
		if (!q) return authors;
		return authors.filter((a) => {
			const name = (a.name ?? "").toLowerCase();
			return a.username.toLowerCase().includes(q) || name.includes(q);
		});
	}, [authors, authorFilter]);

	const [excludeOpen, setExcludeOpen] = useState(false);
	const [excludeFilter, setExcludeFilter] = useState("");

	const filteredTags = useMemo(() => {
		const q = excludeFilter.trim().toLowerCase();
		if (!q) return BLOG_TAGS;
		return BLOG_TAGS.filter(
			(t) => t.slug.toLowerCase().includes(q) || t.label.toLowerCase().includes(q),
		);
	}, [excludeFilter]);

	return (
		<div className="space-y-4">
			<div>
				<SearchInput variant="editorial" defaultValue={query} />
				{hasQuery ? (
					<button
						type="button"
						className="mt-2 text-xs font-medium text-primary underline-offset-4 hover:underline"
						onClick={() =>
							setParamsAndPush(router, pathname, sp, (p) => {
								p.delete("query");
								p.delete("search");
								p.delete("page");
							})
						}
					>
						Clear search
					</button>
				) : null}
			</div>

			<div className="space-y-2">
				<p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
					Author
				</p>
				<button
					type="button"
					onClick={() => setAuthorOpen((v) => !v)}
					className={cn(
						"flex w-full items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2 text-sm",
						"hover:bg-muted/40",
					)}
				>
					<span className="truncate">
						{selectedAuthor ? `@${selectedAuthor}` : "All authors"}
					</span>
					<span className="text-muted-foreground">{authorOpen ? "▲" : "▼"}</span>
				</button>
				{authorOpen ? (
					<div className="rounded-xl border border-border/60 bg-background p-2 shadow-sm">
						<input
							value={authorFilter}
							onChange={(e) => setAuthorFilter(e.target.value)}
							placeholder="Search authors…"
							className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
						/>
						<div className="mt-2 max-h-64 overflow-auto">
							<button
								type="button"
								onClick={() =>
									setParamsAndPush(router, pathname, sp, (p) => {
										p.delete("author");
										p.delete("page");
									})
								}
								className={cn(
									"flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted/40",
									!selectedAuthor && "bg-muted/30",
								)}
							>
								<span>All authors</span>
							</button>
							{filteredAuthors.map((a) => {
								const isSelected = selectedAuthor === a.username.toLowerCase();
								return (
									<button
										key={a.username}
										type="button"
										onClick={() =>
											setParamsAndPush(router, pathname, sp, (p) => {
												p.set("author", a.username.toLowerCase());
												p.delete("page");
											})
										}
										className={cn(
											"flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/40",
											isSelected && "bg-muted/30",
										)}
									>
										<span className="truncate">
											{a.name?.trim()
												? `${a.name.trim()} (@${a.username})`
												: `@${a.username}`}
										</span>
										<span className="shrink-0 text-xs text-muted-foreground tabular-nums">
											{a.articleCount}
										</span>
									</button>
								);
							})}
						</div>
					</div>
				) : null}
			</div>

			<div className="space-y-2">
				<p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
					Exclude topics
				</p>
				<button
					type="button"
					onClick={() => setExcludeOpen((v) => !v)}
					className={cn(
						"flex w-full items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2 text-sm",
						"hover:bg-muted/40",
					)}
				>
					<span className="truncate">
						{excludeTags.length ? `${excludeTags.length} excluded` : "None"}
					</span>
					<span className="text-muted-foreground">{excludeOpen ? "▲" : "▼"}</span>
				</button>
				{excludeOpen ? (
					<div className="rounded-xl border border-border/60 bg-background p-2 shadow-sm">
						<input
							value={excludeFilter}
							onChange={(e) => setExcludeFilter(e.target.value)}
							placeholder="Search topics…"
							className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
						/>
						{excludeTags.length ? (
							<button
								type="button"
								className="mt-2 text-xs font-medium text-primary underline-offset-4 hover:underline"
								onClick={() =>
									setParamsAndPush(router, pathname, sp, (p) => {
										p.delete("excludeTag");
										p.delete("page");
									})
								}
							>
								Clear excluded topics
							</button>
						) : null}
						<div className="mt-2 max-h-64 overflow-auto">
							{filteredTags.map((t) => {
								const checked = excludeSet.has(t.slug);
								return (
									<label
										key={t.slug}
										className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/40"
									>
										<input
											type="checkbox"
											checked={checked}
											onChange={() =>
												setParamsAndPush(router, pathname, sp, (p) => {
													const next = new Set(p.getAll("excludeTag").filter(isBlogTagSlug));
													if (next.has(t.slug)) next.delete(t.slug);
													else next.add(t.slug);
													p.delete("excludeTag");
													[...next].sort().forEach((v) => p.append("excludeTag", v));
													p.delete("page");
												})
											}
										/>
										<span className="truncate">{t.label}</span>
									</label>
								);
							})}
						</div>
					</div>
				) : null}
			</div>

			<div className="space-y-2">
				<p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
					Votes
				</p>
				<div className="flex items-center gap-2">
					<label className="text-sm text-muted-foreground">Min score</label>
					<input
						type="number"
						inputMode="numeric"
						min={-999}
						max={9999}
						defaultValue={sp.get("minScore") ?? ""}
						onBlur={(e) => {
							const raw = e.target.value.trim();
							setParamsAndPush(router, pathname, sp, (p) => {
								if (!raw) p.delete("minScore");
								else p.set("minScore", raw);
								p.delete("page");
							});
						}}
						className="h-9 w-24 rounded-lg border border-border/60 bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary/25"
					/>
				</div>
				<button
					type="button"
					className="text-xs font-medium text-primary underline-offset-4 hover:underline"
					onClick={() =>
						setParamsAndPush(router, pathname, sp, (p) => {
							p.set("sort", "top");
							p.delete("page");
						})
					}
				>
					Sort by top voted
				</button>
			</div>

			<div className="space-y-2">
				<p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
					Popularity
				</p>
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						className="rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
						onClick={() =>
							setParamsAndPush(router, pathname, sp, (p) => {
								p.set("sort", "most-viewed");
								p.delete("page");
							})
						}
					>
						Most viewed
					</button>
					<button
						type="button"
						className="rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
						onClick={() =>
							setParamsAndPush(router, pathname, sp, (p) => {
								p.set("sort", "most-commented");
								p.delete("page");
							})
						}
					>
						Most discussed
					</button>
				</div>
			</div>
		</div>
	);
}


