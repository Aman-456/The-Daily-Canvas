"use client";

import { Button } from "@/components/ui/button";
import { CommentItem } from "./CommentItem";
import type { PublicComment } from "@/types/comment";
import type { Session } from "next-auth";

type Props = {
	comments: PublicComment[];
	blogId: string;
	slug: string;
	sessionUser: Session["user"] | undefined;
	blogAuthorId?: string;
	hasMore: boolean;
	isLoadingMore: boolean;
	onLoadMore: () => void;
	onDeleteRoot: (commentId: string) => void;
	onTotalChange: (delta: number) => void;
};

export function CommentThreadList({
	comments,
	blogId,
	slug,
	sessionUser,
	blogAuthorId,
	hasMore,
	isLoadingMore,
	onLoadMore,
	onDeleteRoot,
	onTotalChange,
}: Props) {
	if (comments.length === 0) {
		return (
			<div className="rounded-lg border border-dashed border-border/60 bg-muted/10 py-12 text-center text-sm text-muted-foreground">
				No comments yet. Be the first to share what you think.
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="space-y-6">
				{comments.map((comment) => (
					<div key={comment._id}>
						<CommentItem
							comment={comment}
							blogId={blogId}
							slug={slug}
							user={sessionUser}
							onDelete={() => onDeleteRoot(comment._id)}
							onTotalChange={onTotalChange}
							blogAuthorId={blogAuthorId}
						/>
					</div>
				))}
			</div>

			{hasMore && (
				<div className="flex justify-center border-t border-border/50 pt-6">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="rounded-full px-6 font-semibold"
						onClick={onLoadMore}
						disabled={isLoadingMore}
					>
						{isLoadingMore ? "Loading…" : "Load more comments"}
					</Button>
				</div>
			)}
		</div>
	);
}
