"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
	/** When this value changes, the “fired once” flag resets so a new load cycle can run. */
	resetKey: string;
	rootMargin?: string;
	threshold?: number;
};

/**
 * Fires when the observed element intersects the viewport (with margin), at most once per resetKey
 * until resetKey changes. Use to defer data fetching until the user scrolls near a section.
 */
export function useNearViewportOnce({
	resetKey,
	rootMargin = "0px 0px 180px 0px",
	threshold = 0,
}: Options) {
	const [hasBeenNear, setHasBeenNear] = useState(false);
	const ref = useRef<HTMLElement | null>(null);

	// Reset latch when navigating to another blog — effect is the correct place for this.
	/* eslint-disable react-hooks/set-state-in-effect -- intentional latch reset on resetKey */
	useEffect(() => {
		setHasBeenNear(false);
	}, [resetKey]);
	/* eslint-enable react-hooks/set-state-in-effect */

	useEffect(() => {
		if (hasBeenNear) return;
		const el = ref.current;
		if (!el) return;

		const obs = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					setHasBeenNear(true);
				}
			},
			{ root: null, rootMargin, threshold },
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, [hasBeenNear, resetKey, rootMargin, threshold]);

	return { ref, hasBeenNear };
}
