"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ReactNode } from "react";
import type { PublicComment } from "@/types/comment";
import { formatRelativeTime } from "@/lib/utils";

type Props = {
	comment: PublicComment;
	blogAuthorId?: string;
	children?: ReactNode;
	/** When false, avatar is rendered by the parent (thread rail layout). */
	showAvatar?: boolean;
	/** Client-side soft delete (e.g. removed but thread kept); show like server deleted. */
	treatAsDeleted?: boolean;
};

export function CommentItemMeta({
	comment,
	blogAuthorId,
	children,
	showAvatar = true,
	treatAsDeleted = false,
}: Props) {
	const showDeleted = comment.isDeleted || treatAsDeleted;
	const isOp =
		Boolean(blogAuthorId) &&
		comment.userId?._id === blogAuthorId &&
		!showDeleted;

	const body = (
		<div className="min-w-0 flex-1 space-y-2">
			<div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
				<span
					className={
						isOp
							? "font-semibold text-primary/90"
							: "font-semibold text-foreground"
					}
				>
					{showDeleted
						? "[deleted]"
						: (comment.userId?.name ?? "Deleted user")}
				</span>
				{isOp && (
					<span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
						Author
					</span>
				)}
				<span className="text-muted-foreground">·</span>
				<time
					className="text-xs text-muted-foreground"
					dateTime={
						comment.createdAt instanceof Date
							? comment.createdAt.toISOString()
							: comment.createdAt
					}
				>
					{formatRelativeTime(comment.createdAt)}
				</time>
				{comment.isEdited && (
					<span className="text-xs italic text-muted-foreground">(edited)</span>
				)}
			</div>

			{comment.isHidden && !showDeleted ? (
				<p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
					This comment is hidden.
				</p>
			) : null}

			{children}
		</div>
	);

	if (!showAvatar) {
		return body;
	}

	return (
		<div className="flex gap-3">
			<Avatar className="h-8 w-8 shrink-0 border border-border/60">
				<AvatarImage
					src={
						showDeleted ? undefined : (comment.userId?.image ?? undefined)
					}
					alt=""
				/>
				<AvatarFallback>
					{showDeleted ? "—" : (comment.userId?.name?.charAt(0) ?? "?")}
				</AvatarFallback>
			</Avatar>
			{body}
		</div>
	);
}
