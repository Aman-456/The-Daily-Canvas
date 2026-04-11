"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getComments } from "@/actions/comment";
import type { PublicComment } from "@/types/comment";

function toIsoTimestamp(value: string | Date | undefined): string | undefined {
	if (value === undefined) return undefined;
	return value instanceof Date ? value.toISOString() : value;
}

type UseBlogCommentThreadArgs = {
	blogId: string;
	initialHasMore: boolean;
	total: number;
	limit: number;
};

export function useBlogCommentThread({
	blogId,
	initialHasMore,
	total,
	limit,
}: UseBlogCommentThreadArgs) {
	const [comments, setComments] = useState<PublicComment[]>([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [isLoaded, setIsLoaded] = useState(false);
	const [isLoadingFirst, setIsLoadingFirst] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [localTotal, setLocalTotal] = useState(total);
	const firstLoadGuard = useRef(false);
	const isLoadedRef = useRef(false);

	useEffect(() => {
		setLocalTotal(total);
	}, [total]);

	useEffect(() => {
		setComments([]);
		setPage(1);
		setHasMore(initialHasMore);
		setIsLoaded(false);
		isLoadedRef.current = false;
		setIsLoadingFirst(false);
		setIsLoadingMore(false);
		firstLoadGuard.current = false;
	}, [blogId, initialHasMore]);

	useEffect(() => {
		isLoadedRef.current = isLoaded;
	}, [isLoaded]);

	const loadFirstPage = useCallback(async () => {
		if (isLoadedRef.current || firstLoadGuard.current) return;
		firstLoadGuard.current = true;
		setIsLoadingFirst(true);
		try {
			const result = await getComments(blogId, 1, limit);
			if (result.success && result.data) {
				setComments(result.data.comments as PublicComment[]);
				setHasMore(result.data.hasMore);
				setPage(1);
				setIsLoaded(true);
				isLoadedRef.current = true;
			} else {
				firstLoadGuard.current = false;
				toast.error(result.error || "Failed to load comments");
			}
		} catch {
			firstLoadGuard.current = false;
			toast.error("Failed to load comments");
		} finally {
			setIsLoadingFirst(false);
		}
	}, [blogId, limit]);

	const loadMore = useCallback(async () => {
		setIsLoadingMore(true);
		try {
			const nextPage = page + 1;
			const lastTimestamp =
				comments.length > 0
					? toIsoTimestamp(comments[comments.length - 1].createdAt)
					: undefined;
			const result = await getComments(blogId, nextPage, limit, lastTimestamp);

			if (result.success && result.data) {
				const newComments = result.data.comments as PublicComment[];
				setComments((prev) => {
					const existingIds = new Set(prev.map((c) => c._id));
					const uniqueNew = newComments.filter((c) => !existingIds.has(c._id));
					return [...prev, ...uniqueNew];
				});
				setHasMore(result.data.hasMore);
				setPage(nextPage);
			} else {
				toast.error(result.error || "Failed to load more comments");
			}
		} catch {
			toast.error("Failed to load more comments");
		} finally {
			setIsLoadingMore(false);
		}
	}, [blogId, comments, limit, page]);

	const removeComment = useCallback((commentId: string) => {
		setComments((prev) => prev.filter((c) => c._id !== commentId));
	}, []);

	const prependComment = useCallback((comment: PublicComment) => {
		setComments((prev) => [comment, ...prev]);
	}, []);

	return {
		comments,
		setComments,
		page,
		hasMore,
		isLoaded,
		isLoadingFirst,
		isLoadingMore,
		localTotal,
		setLocalTotal,
		loadFirstPage,
		loadMore,
		removeComment,
		prependComment,
	};
}
