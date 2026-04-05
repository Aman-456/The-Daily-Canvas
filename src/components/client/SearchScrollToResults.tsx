"use client";

import { useEffect } from "react";

/** Set in SearchInput before navigating to `/search` with a title query. */
export const SEARCH_SCROLL_RESULTS_FLAG = "tdc-scroll-search-results";

const DURATION_MS = 1100;

/** Extra space above `#search-blog-results` after scroll (beyond sticky header clearance). */
const RESULT_SCROLL_EXTRA_ABOVE_PX = 160;

function easeInOutCubic(t: number) {
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function slowScrollToY(targetY: number, durationMs: number): () => void {
	const startY = window.scrollY;
	const delta = targetY - startY;
	if (Math.abs(delta) < 6) return () => {};
	let cancelled = false;
	const start = performance.now();
	const step = (now: number) => {
		if (cancelled) return;
		const t = Math.min(1, (now - start) / durationMs);
		window.scrollTo(0, startY + delta * easeInOutCubic(t));
		if (t < 1) requestAnimationFrame(step);
	};
	requestAnimationFrame(step);
	return () => {
		cancelled = true;
	};
}

/**
 * After a title search submit, slowly scrolls to `#search-blog-results`.
 * No-op for direct loads without the sessionStorage flag (e.g. shared URLs).
 *
 * `queryKey` must change when the title query changes so in-page submits on
 * `/search` re-run the effect (hasQuery can stay true).
 */
export function SearchScrollToResults({
	hasQuery,
	queryKey,
}: {
	hasQuery: boolean;
	/** Canonical title query string (empty when browsing with no title filter). */
	queryKey: string;
}) {
	useEffect(() => {
		if (!hasQuery || typeof window === "undefined") return;

		let cancelScroll: (() => void) | undefined;
		const timeoutId = window.setTimeout(() => {
			try {
				if (sessionStorage.getItem(SEARCH_SCROLL_RESULTS_FLAG) !== "1") return;
				sessionStorage.removeItem(SEARCH_SCROLL_RESULTS_FLAG);
			} catch {
				return;
			}

			const el = document.getElementById("search-blog-results");
			if (!el) return;

			const headerOffset = 100;
			const rect = el.getBoundingClientRect();
			const targetY =
				rect.top +
				window.scrollY -
				headerOffset -
				RESULT_SCROLL_EXTRA_ABOVE_PX;
			const maxY = Math.max(
				0,
				document.documentElement.scrollHeight - window.innerHeight,
			);
			const y = Math.min(Math.max(0, targetY), maxY);
			cancelScroll = slowScrollToY(y, DURATION_MS);
		}, 100);

		return () => {
			window.clearTimeout(timeoutId);
			cancelScroll?.();
		};
	}, [hasQuery, queryKey]);

	return null;
}
