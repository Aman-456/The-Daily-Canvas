"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getReplies } from "@/actions/comment";
import type { PublicComment } from "@/types/comment";

function toIsoTimestamp(value: string | Date | undefined): string | undefined {
	if (value === undefined) return undefined;
	return value instanceof Date ? value.toISOString() : value;
}

type Args = {
	commentId: string;
	initialReplies: PublicComment[];
	replyCount: number;
};

export function useCommentReplies({
	commentId,
	initialReplies,
	replyCount,
}: Args) {
	const [replies, setReplies] = useState<PublicComment[]>(initialReplies);
	const [replyPage, setReplyPage] = useState(1);
	const [hasMoreReplies, setHasMoreReplies] = useState(
		replyCount > initialReplies.length,
	);
	const [isLoadingReplies, setIsLoadingReplies] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(true);

	const removeReply = useCallback((replyId: string) => {
		setReplies((prev) => prev.filter((r) => r._id !== replyId));
	}, []);

	const loadMoreReplies = useCallback(async () => {
		setIsLoadingReplies(true);
		try {
			const nextPage = replyPage + 1;
			const lastTimestamp =
				replies.length > 0
					? toIsoTimestamp(replies[replies.length - 1].createdAt)
					: undefined;

			const result = await getReplies(commentId, nextPage, 10, lastTimestamp);
			if (result.success && result.data) {
				const newReplies = result.data.replies as PublicComment[];
				setReplies((prev) => {
					const existingIds = new Set(prev.map((r) => r._id));
					const uniqueNew = newReplies.filter((r) => !existingIds.has(r._id));
					return [...prev, ...uniqueNew];
				});
				setHasMoreReplies(result.data.hasMore);
				setReplyPage(nextPage);
			}
		} catch {
			toast.error("Failed to load more replies");
		} finally {
			setIsLoadingReplies(false);
		}
	}, [commentId, replies, replyPage]);

	const expandAndFetchFirstPage = useCallback(async () => {
		setIsCollapsed(false);
		if (replies.length > 0 || replyCount <= 0) return;

		setIsLoadingReplies(true);
		try {
			const result = await getReplies(commentId, 1);
			if (result.success && result.data) {
				setReplies(result.data.replies as PublicComment[]);
				setHasMoreReplies(result.data.hasMore);
				setReplyPage(1);
			}
		} catch {
			toast.error("Failed to load replies");
		} finally {
			setIsLoadingReplies(false);
		}
	}, [commentId, replies.length, replyCount]);

	const toggleCollapse = useCallback(async () => {
		if (!isCollapsed) {
			setIsCollapsed(true);
			return;
		}
		await expandAndFetchFirstPage();
	}, [isCollapsed, expandAndFetchFirstPage]);

	return {
		replies,
		setReplies,
		hasMoreReplies,
		isLoadingReplies,
		isCollapsed,
		setIsCollapsed,
		loadMoreReplies,
		toggleCollapse,
		removeReply,
	};
}
