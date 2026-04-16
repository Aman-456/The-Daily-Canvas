"use client";

import { useEffect, useState } from "react";
import { formatCompactNumber } from "@/lib/utils";

const DEDUPE_MS = 4000;

function shouldSendViewBeacon(slug: string): boolean {
	try {
		const key = `tdc-blog-view:${slug}`;
		const now = Date.now();
		const prev = Number(sessionStorage.getItem(key) || "0");
		if (prev && now - prev < DEDUPE_MS) return false;
		sessionStorage.setItem(key, String(now));
		return true;
	} catch {
		return true;
	}
}

/**
 * Shows view count and registers one view per real visit via POST.
 * Uses a short sessionStorage window so React Strict Mode’s double effect doesn’t double-count.
 */
export function BlogViewTracker({
	slug,
	initialCount,
}: {
	slug: string;
	initialCount?: number;
}) {
	const [count, setCount] = useState<number | null>(
		typeof initialCount === "number" ? initialCount : null,
	);

	useEffect(() => {
		if (!shouldSendViewBeacon(slug)) return;

		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(
					`/api/blogs/${encodeURIComponent(slug)}/view`,
					{ method: "POST" },
				);
				if (!res.ok || cancelled) return;
				const data = (await res.json()) as { viewCount?: number };
				if (typeof data.viewCount === "number") {
					setCount(data.viewCount);
				}
			} catch {
				/* network / parse */
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [slug]);

	const exact = count === null ? undefined : `${count.toLocaleString("en-US")} views`;

	return (
		<span
			className="tabular-nums text-muted-foreground"
			aria-live="polite"
			aria-label={count === null ? "Loading views" : exact}
			title={count === null ? "Loading views" : exact}
		>
			{count === null ? (
				<span className="inline-block h-4 w-14 animate-pulse rounded bg-muted/70 align-middle" />
			) : (
				`${formatCompactNumber(count)} views`
			)}
		</span>
	);
}
