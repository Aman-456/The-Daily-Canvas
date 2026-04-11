"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { addComment, updateComment, deleteComment } from "@/actions/comment";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { isAdmin } from "@/lib/utils";
import type { Session } from "next-auth";
import { useCommentReplies } from "@/hooks/useCommentReplies";
import { CommentItemMeta } from "@/components/client/comments/CommentItemMeta";
import { CommentItemInlineReply } from "@/components/client/comments/CommentItemInlineReply";
import type { PublicComment } from "@/types/comment";

type Props = {
	comment: PublicComment;
	blogId: string;
	slug: string;
	user: Session["user"] | undefined;
	depth?: number;
	onDelete?: () => void;
	onTotalChange?: (delta: number) => void;
	blogAuthorId?: string;
};

export function CommentItem({
	comment,
	blogId,
	slug,
	user,
	depth = 0,
	onDelete,
	onTotalChange,
	blogAuthorId,
}: Props) {
	const pathname = usePathname();
	const signInHref = useMemo(
		() =>
			`/signin?callbackUrl=${encodeURIComponent(`${pathname}#comments`)}`,
		[pathname],
	);

	const [isReplying, setIsReplying] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [replyContent, setReplyContent] = useState("");
	const [editContent, setEditContent] = useState(comment.content);
	/** After a successful edit, show this until props refresh or `comment._id` changes (parent key). */
	const [lastSavedBody, setLastSavedBody] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const {
		replies,
		setReplies,
		hasMoreReplies,
		isLoadingReplies,
		isCollapsed,
		loadMoreReplies,
		toggleCollapse,
		removeReply,
	} = useCommentReplies({
		commentId: comment._id,
		initialReplies: comment.replies ?? [],
		replyCount: comment.replyCount ?? 0,
	});

	const displayContent = isEditing
		? editContent
		: (lastSavedBody ?? comment.content);

	const isOwner =
		Boolean(user?.id) &&
		(user!.id === comment.userId?._id || user!.id === (comment.userId as { id?: string })?.id);
	const isAdminRole = isAdmin(user?.role);
	const showEditInDropdown =
		isOwner && !isEditing && !comment.isDeleted;
	const showDeleteInDropdown =
		(isOwner || isAdminRole) && !isEditing && !comment.isDeleted;

	const handleReply = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!replyContent.trim() || !user) return;

		startTransition(async () => {
			try {
				const formData = new FormData();
				formData.append("content", replyContent);
				formData.append("blogId", blogId);
				formData.append("slug", slug);
				formData.append("parentId", comment._id);

				const result = await addComment(formData);
				if (result.success && result.data) {
					setReplyContent("");
					setIsReplying(false);
					toast.success("Reply posted");
					setReplies((prev) => [...prev, result.data as PublicComment]);
					if (onTotalChange) onTotalChange(1);
				} else {
					toast.error(result.error || "Failed to add reply");
				}
			} catch {
				toast.error("Something went wrong");
			}
		});
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editContent.trim()) return;

		startTransition(async () => {
			try {
				const result = await updateComment(comment._id, editContent, slug);
				if (result.success) {
					setIsEditing(false);
					setLastSavedBody(editContent);
					toast.success("Comment updated");
				} else {
					toast.error(result.error || "Failed to update");
				}
			} catch {
				toast.error("Something went wrong");
			}
		});
	};

	const handleDelete = async () => {
		if (!confirm("Delete this comment?")) return;

		startTransition(async () => {
			try {
				const result = await deleteComment(comment._id, blogId, slug);
				if (result.success) {
					toast.success("Comment deleted");
					onDelete?.();
					onTotalChange?.(-1);
				} else {
					toast.error(result.error || "Failed to delete");
				}
			} catch {
				toast.error("Something went wrong");
			}
		});
	};

	const maxDepth = 8;
	const nestClass =
		depth > 0 ? "ml-3 border-l border-border/50 pl-3 md:ml-6 md:pl-4" : "";

	return (
		<div className={`group space-y-2 ${nestClass}`}>
			<CommentItemMeta
				comment={comment}
				blogAuthorId={blogAuthorId}
				showEditInDropdown={showEditInDropdown}
				showDeleteInDropdown={showDeleteInDropdown}
				onEditRequest={() => {
					setEditContent(lastSavedBody ?? comment.content);
					setIsEditing(true);
				}}
				onDeleteRequest={handleDelete}
			>
				{isEditing ? (
					<form onSubmit={handleUpdate} className="space-y-2">
						<Textarea
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							className="min-h-[80px] bg-background text-sm"
							autoFocus
						/>
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 rounded-full text-xs"
								onClick={() => {
									setIsEditing(false);
									setEditContent(lastSavedBody ?? comment.content);
								}}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								size="sm"
								className="h-8 rounded-full px-4 text-xs font-semibold"
								disabled={isPending || !editContent.trim()}
							>
								{isPending ? "Saving…" : "Save"}
							</Button>
						</div>
					</form>
				) : (
					<p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
						{displayContent}
					</p>
				)}

				{!isEditing && !comment.isDeleted && (
					<div className="flex flex-wrap items-center gap-2 pt-0.5">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-7 rounded-full px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
							onClick={() => setIsReplying((v) => !v)}
						>
							<MessageSquare className="mr-1 h-3 w-3" />
							Reply
						</Button>

						{((comment.replyCount ?? 0) > 0 || replies.length > 0) && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-7 rounded-full px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
								onClick={() => void toggleCollapse()}
								disabled={isLoadingReplies}
							>
								{isCollapsed ? (
									<>
										<ChevronDown className="mr-1 h-3 w-3" />
										{isLoadingReplies
											? "Loading…"
											: `${comment.replyCount ?? replies.length} ${(comment.replyCount ?? replies.length) === 1 ? "reply" : "replies"}`}
									</>
								) : (
									<>
										<ChevronUp className="mr-1 h-3 w-3" />
										Hide replies
									</>
								)}
							</Button>
						)}
					</div>
				)}
			</CommentItemMeta>

			{isReplying && !isEditing && !comment.isDeleted && (
				<CommentItemInlineReply
					replyName={comment.userId?.name}
					replyContent={replyContent}
					onReplyContentChange={setReplyContent}
					isPending={isPending}
					onSubmit={handleReply}
					onCancel={() => {
						setIsReplying(false);
						setReplyContent("");
					}}
					sessionUser={user}
					signInHref={signInHref}
				/>
			)}

			{!isCollapsed && (
				<div className="ml-2 mt-1 space-y-3 border-l border-border/40 pl-2 md:ml-4 md:pl-3">
					{replies.map((reply) =>
						depth < maxDepth ? (
							<CommentItem
								key={reply._id}
								comment={reply}
								blogId={blogId}
								slug={slug}
								user={user}
								depth={depth + 1}
								onDelete={() => removeReply(reply._id)}
								onTotalChange={onTotalChange}
								blogAuthorId={blogAuthorId}
							/>
						) : (
							<p key={reply._id} className="text-xs text-muted-foreground">
								Reply depth limit reached.{" "}
								<Link href={`/blogs/${slug}#comments`} className="underline">
									Open thread
								</Link>
							</p>
						),
					)}

					{hasMoreReplies && depth < maxDepth && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-7 rounded-full px-2 text-xs text-primary"
							onClick={() => void loadMoreReplies()}
							disabled={isLoadingReplies}
						>
							{isLoadingReplies ? "Loading…" : "Load more replies"}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
