"use client";

import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { addComment } from "@/actions/comment";
import { toast } from "sonner";
import { useNearViewportOnce } from "@/hooks/useNearViewportOnce";
import { useBlogCommentThread } from "@/hooks/useBlogCommentThread";
import { CommentThreadHeader } from "@/components/client/comments/CommentThreadHeader";
import { CommentComposer } from "@/components/client/comments/CommentComposer";
import { CommentThreadList } from "@/components/client/comments/CommentThreadList";
import { CommentThreadSkeleton } from "@/components/client/comments/CommentThreadSkeleton";
import { LatestCommentPreview } from "@/components/client/comments/LatestCommentPreview";
import type { PublicComment } from "@/types/comment";

export type BlogCommentThreadProps = {
	blogId: string;
	slug: string;
	initialHasMore: boolean;
	total: number;
	limit?: number;
	latestComment?: PublicComment | null;
	blogAuthorId?: string;
};

export function BlogCommentThread({
	blogId,
	slug,
	initialHasMore,
	total,
	limit = 10,
	latestComment,
	blogAuthorId,
}: BlogCommentThreadProps) {
	const { data: session, status } = useSession();
	const sessionUser = useMemo(() => {
		if (status === "unauthenticated") return undefined;
		if (session?.user?.id) return session.user;
		return undefined;
	}, [session?.user, status]);
	const pathname = usePathname();
	const signInHref = useMemo(
		() =>
			`/signin?callbackUrl=${encodeURIComponent(`${pathname}#comment-form`)}`,
		[pathname],
	);

	const [content, setContent] = useState("");
	const [isPending, startTransition] = useTransition();

	const {
		comments,
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
	} = useBlogCommentThread({
		blogId,
		initialHasMore,
		total,
		limit,
	});

	const isLoadedLiveRef = useRef(isLoaded);
	useLayoutEffect(() => {
		isLoadedLiveRef.current = isLoaded;
	}, [isLoaded]);

	const { ref: viewportRef, hasBeenNear } = useNearViewportOnce({
		resetKey: blogId,
		rootMargin: "0px 0px 200px 0px",
	});

	useEffect(() => {
		// Avoid fetching comments when the stored aggregate is 0.
		// The thread can still load after the first comment is posted.
		if (hasBeenNear && total > 0) {
			void loadFirstPage();
		}
	}, [hasBeenNear, loadFirstPage, total]);

	const scrollToComposer = useCallback(() => {
		document.getElementById("comment-form")?.scrollIntoView({
			behavior: "smooth",
			block: "center",
		});
	}, []);

	const handleSubmitLoggedIn = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!content.trim() || !sessionUser) return;

		startTransition(async () => {
			try {
				const formData = new FormData();
				formData.append("content", content);
				formData.append("blogId", blogId);
				formData.append("slug", slug);

				const result = await addComment(formData);
				if (result.success && result.data) {
					setContent("");
					toast.success("Comment posted");
					setLocalTotal((p) => p + 1);
					if (!isLoadedLiveRef.current) {
						await loadFirstPage();
					} else {
						prependComment(result.data as PublicComment);
					}
				} else {
					toast.error(result.error || "Failed to post comment");
				}
			} catch {
				toast.error("Something went wrong");
			}
		});
	};

	return (
		<section
			ref={viewportRef}
			id="comments"
			className="mx-auto mt-12 max-w-3xl scroll-mt-24 space-y-6"
			aria-label="Comments"
		>
			<CommentThreadHeader count={localTotal} />

			<CommentComposer
				sessionUser={sessionUser}
				content={content}
				onContentChange={setContent}
				isPending={isPending}
				onSubmitLoggedIn={handleSubmitLoggedIn}
				signInHref={signInHref}
			/>

			{!isLoaded && latestComment && !isLoadingFirst && (
				<LatestCommentPreview latest={latestComment} />
			)}

			{isLoadingFirst && <CommentThreadSkeleton />}

			{isLoaded && (
				<CommentThreadList
					comments={comments}
					blogId={blogId}
					slug={slug}
					sessionUser={sessionUser}
					blogAuthorId={blogAuthorId}
					hasMore={hasMore}
					isLoadingMore={isLoadingMore}
					onLoadMore={() => void loadMore()}
					onDeleteRoot={removeComment}
					onTotalChange={(delta) =>
						setLocalTotal((prev) => Math.max(0, prev + delta))
					}
				/>
			)}
		</section>
	);
}
