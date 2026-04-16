"use client";

import { useEffect, useMemo, useState } from "react";
import type { BlogPostCardItem } from "@/types/blog-post-card";
import { getRelatedBlogsAction } from "@/actions/related";
import { RelatedPosts } from "@/components/client/RelatedPosts";
import { useNearViewportOnce } from "@/hooks/useNearViewportOnce";

export function RelatedPostsHydrator(props: {
	blogId: string;
	tags: string[];
	limit?: number;
}) {
	const [posts, setPosts] = useState<BlogPostCardItem[] | null>(null);

	const tags = useMemo(
		() => [...new Set((props.tags ?? []).filter(Boolean))].sort(),
		[props.tags],
	);
	const key = useMemo(() => `${props.blogId}:${tags.join(",")}:${props.limit ?? 4}`, [props.blogId, tags, props.limit]);

	const { ref, hasBeenNear } = useNearViewportOnce({
		resetKey: key,
		// Match the comment thread behavior: only fetch when the reader scrolls near.
		rootMargin: "0px 0px 400px 0px",
	});

	useEffect(() => {
		if (!hasBeenNear) return;
		let cancelled = false;
		(async () => {
			if (!props.blogId || tags.length === 0) {
				setPosts([]);
				return;
			}
			const res = await getRelatedBlogsAction({
				blogId: props.blogId,
				tags,
				limit: props.limit ?? 4,
			});
			if (cancelled) return;
			if (!res.success) {
				setPosts([]);
				return;
			}
			setPosts((res.data?.posts ?? []) as BlogPostCardItem[]);
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key, hasBeenNear]);

	if (posts === null) {
		if (!hasBeenNear) {
			return <div ref={ref as any} />;
		}
		return (
			<section ref={ref as any} className="pt-10 border-t space-y-4">
				<div className="h-5 w-32 animate-pulse rounded bg-muted/70" />
				<div className="h-4 w-72 animate-pulse rounded bg-muted/70" />
				<ul className="grid sm:grid-cols-2 gap-4">
					{Array.from({ length: 2 }).map((_, i) => (
						<li key={i} className="flex gap-3 rounded-xl border border-border/50 p-3">
							<div className="w-24 h-16 rounded-lg bg-muted/70 animate-pulse" />
							<div className="min-w-0 flex-1 space-y-2">
								<div className="h-4 w-5/6 rounded bg-muted/70 animate-pulse" />
								<div className="h-3 w-4/6 rounded bg-muted/70 animate-pulse" />
							</div>
						</li>
					))}
				</ul>
			</section>
		);
	}

	return <RelatedPosts posts={posts} />;
}

