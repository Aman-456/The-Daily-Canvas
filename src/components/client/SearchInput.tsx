"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import {
	archiveListingHref,
	isBlogTagSlug,
	topicListingHref,
} from "@/lib/blog-tags";
import { parseBlogListSort } from "@/lib/blog-list-sort";

export default function SearchInput({
	defaultValue,
	variant = "default",
}: {
	defaultValue: string;
	variant?: "default" | "editorial" | "hero";
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const query = (formData.get("search") as string) ?? "";

		const params = new URLSearchParams();
		for (const tag of searchParams.getAll("tag")) {
			if (isBlogTagSlug(tag)) params.append("tag", tag);
		}
		const topicSeg = pathname.match(/^\/topics\/([^/]+)$/);
		if (topicSeg?.[1] && isBlogTagSlug(topicSeg[1])) {
			const fromQuery = new Set(params.getAll("tag"));
			if (!fromQuery.has(topicSeg[1])) params.append("tag", topicSeg[1]);
		}

		const sort = parseBlogListSort(searchParams.get("sort"));

		if (!query.trim()) {
			if (pathname === "/search") {
				params.delete("query");
				params.delete("search");
				if (sort !== "newest") params.set("sort", sort);
				const qs = params.toString();
				router.push(qs ? `/search?${qs}` : "/search");
				return;
			}
			const tags = [
				...new Set(
					[...params.getAll("tag")].filter(isBlogTagSlug),
				),
			].sort();
			if (tags.length === 0) {
				router.push("/archive");
			} else if (tags.length === 1) {
				router.push(topicListingHref({ slug: tags[0], sort }));
			} else {
				router.push(archiveListingHref({ tags, sort }));
			}
			return;
		}

		params.set("query", query.trim());
		if (sort !== "newest") params.set("sort", sort);

		const qs = params.toString();
		router.push(qs ? `/search?${qs}` : "/search");
	};

	if (variant === "hero") {
		return (
			<form onSubmit={handleSearch} className="relative w-full">
				<Search
					className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
					aria-hidden
				/>
				<input
					type="search"
					name="search"
					defaultValue={defaultValue}
					placeholder="Search our stories…"
					aria-label="Search stories"
					className="w-full rounded-xl border-0 bg-muted/80 py-5 pl-14 pr-5 text-lg text-foreground shadow-sm placeholder:text-muted-foreground transition-colors focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-muted/50 dark:focus:bg-background"
				/>
			</form>
		);
	}

	if (variant === "editorial") {
		return (
			<form
				onSubmit={handleSearch}
				className="relative w-full"
			>
				<Search
					className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
					aria-hidden
				/>
				<input
					type="search"
					name="search"
					defaultValue={defaultValue}
					placeholder="Search curated stories…"
					className="h-10 w-full rounded-xl border-0 bg-muted/80 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 dark:bg-muted/50"
				/>
			</form>
		);
	}

	return (
		<form onSubmit={handleSearch} className="relative flex w-full md:w-auto">
			<input
				type="search"
				name="search"
				defaultValue={defaultValue}
				placeholder="Search blogs..."
				className="h-10 w-full rounded-full border border-border bg-background px-4 md:w-[300px] focus:outline-none focus:ring-2 focus:ring-primary/50"
			/>
		</form>
	);
}
