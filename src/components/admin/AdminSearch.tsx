"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function AdminSearch({
	placeholder = "Search...",
	className,
}: {
	placeholder?: string;
	/** Applied to the outer wrapper (e.g. w-full max-w-md) */
	className?: string;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const [isPending, startTransition] = useTransition();
	const [value, setValue] = useState(searchParams.get("search") || "");

	// Sync value with URL if it changes externally
	useEffect(() => {
		setValue(searchParams.get("search") || "");
	}, [searchParams]);

	useEffect(() => {
		const currentSearch = searchParams.get("search") || "";

		// Only set a timeout if the value actually changed from what's in the URL
		if (value === currentSearch) return;

		const timeout = setTimeout(() => {
			const params = new URLSearchParams(searchParams.toString());
			if (value) {
				params.set("search", value);
			} else {
				params.delete("search");
			}
			params.set("page", "1");

			// If the new URL is identical to the current one, don't push
			const newQueryString = params.toString();
			const currentQueryString = searchParams.toString();

			// We check if the search specifically changed or if we are just adding page=1 redundantly
			if (newQueryString !== currentQueryString) {
				startTransition(() => {
					router.push(`${pathname}?${newQueryString}`);
				});
			}
		}, 500);

		return () => clearTimeout(timeout);
	}, [value, pathname, router, searchParams]);

	return (
		<div
			className={cn(
				"relative w-full max-w-md rounded-lg border border-border/60 bg-background shadow-sm",
				className,
			)}
		>
			<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				placeholder={placeholder}
				className="pl-9"
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>
			{isPending && (
				<div className="absolute right-3 top-1/2 -translate-y-1/2">
					<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
				</div>
			)}
		</div>
	);
}
