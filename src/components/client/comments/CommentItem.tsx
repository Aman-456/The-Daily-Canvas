"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { addComment, updateComment, deleteComment } from "@/actions/comment";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
	Copy,
	ExternalLink,
	Loader2,
	MessageSquare,
	Minus,
	Plus,
	Share2,
} from "lucide-react";
import { cn, isAdmin } from "@/lib/utils";
import type { Session } from "next-auth";
import { useCommentReplies } from "@/hooks/useCommentReplies";
import { CommentItemMeta } from "@/components/client/comments/CommentItemMeta";
import { CommentItemInlineReply } from "@/components/client/comments/CommentItemInlineReply";
import {
	ThreadCollapseToggle,
	ThreadConnector,
	ThreadRepliesList,
	ThreadSpine,
	THREAD_STEP_PX,
} from "@/components/client/comments/CommentThreadGutter";
import { absoluteUrl } from "@/lib/json-ld";
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
	hidePermalink?: boolean;
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
	hidePermalink = false,
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
	const [lastSavedBody, setLastSavedBody] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const {
		replies,
		setReplies,
		hasMoreReplies,
		isLoadingReplies,
		isCollapsed,
		setIsCollapsed,
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

	const visibleReplyCount = Math.max(
		comment.replyCount ?? 0,
		replies.length,
	);

	const isOwner =
		Boolean(user?.id) &&
		(user!.id === comment.userId?._id ||
			user!.id === (comment.userId as { id?: string })?.id);
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
					setIsCollapsed(false);
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
	const maxInlineDepth = 4;
	const showReplyToggle = visibleReplyCount > 0 || replies.length > 0;

	const showEarlyContinueThread =
		!hidePermalink &&
		!comment.isDeleted &&
		showReplyToggle &&
		depth >= maxInlineDepth - 1;

	const collapseLabel = isCollapsed
		? `Expand ${visibleReplyCount} ${visibleReplyCount === 1 ? "reply" : "replies"}`
		: `Collapse ${visibleReplyCount} ${visibleReplyCount === 1 ? "reply" : "replies"}`;

	const threadHref = `/blogs/${slug}/thread/${comment._id}`;
	const showShare = !hidePermalink && !comment.isDeleted;
	const absoluteThreadUrl = useMemo(() => {
		const fromEnv = absoluteUrl(threadHref);
		if (fromEnv.startsWith("http://") || fromEnv.startsWith("https://"))
			return fromEnv;
		if (typeof window !== "undefined")
			return `${window.location.origin}${threadHref}`;
		return fromEnv || threadHref;
	}, [threadHref]);

	const copyThreadLink = async () => {
		try {
			await navigator.clipboard.writeText(absoluteThreadUrl);
			toast.success("Link copied");
		} catch {
			toast.error("Could not copy link");
		}
	};

	const toggleIcon = isLoadingReplies ? (
		<Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
	) : isCollapsed ? (
		<Plus className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />
	) : (
		<Minus className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />
	);

	const hasGutter = showReplyToggle || depth > 0;

	return (
		<div className="group/thread relative min-w-0 py-1">
			{showReplyToggle && (
				<>
					<ThreadSpine />
					<ThreadCollapseToggle
						isCollapsed={isCollapsed}
						isLoadingReplies={isLoadingReplies}
						onToggle={() => void toggleCollapse()}
						collapseLabel={collapseLabel}
						visibleReplyCount={visibleReplyCount}
						toggleIcon={toggleIcon}
					/>
				</>
			)}

			{depth > 0 && <ThreadConnector />}

			<div style={hasGutter ? { paddingLeft: THREAD_STEP_PX } : undefined}>
				<div className="space-y-2">
					<div className="flex min-w-0 items-start gap-2">
						<Avatar className="mt-0.5 h-8 w-8 shrink-0 border border-border/50">
							<AvatarImage
								src={
									comment.isDeleted
										? undefined
										: (comment.userId?.image ?? undefined)
								}
								alt=""
							/>
							<AvatarFallback>
								{comment.isDeleted
									? "—"
									: (comment.userId?.name?.charAt(0) ?? "?")}
							</AvatarFallback>
						</Avatar>

						<div className="min-w-0 flex-1 space-y-2">
							<CommentItemMeta
								comment={comment}
								blogAuthorId={blogAuthorId}
								showEditInDropdown={showEditInDropdown}
								showDeleteInDropdown={showDeleteInDropdown}
								showAvatar={false}
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
											onChange={(e) =>
												setEditContent(e.target.value)
											}
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
													setEditContent(
														lastSavedBody ??
															comment.content,
													);
												}}
											>
												Cancel
											</Button>
											<Button
												type="submit"
												size="sm"
												className="h-8 rounded-full px-4 text-xs font-semibold"
												disabled={
													isPending ||
													!editContent.trim()
												}
											>
												{isPending
													? "Saving…"
													: "Save"}
											</Button>
										</div>
									</form>
								) : (
									<p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
										{displayContent}
									</p>
								)}

								{!isEditing && !comment.isDeleted && (
									<div className="flex flex-wrap items-center gap-x-1 gap-y-1 pt-0.5">
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="h-7 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground"
											onClick={() => {
												if (isReplying) {
													setIsReplying(false);
													return;
												}
												if (
													showReplyToggle &&
													isCollapsed
												) {
													setIsCollapsed(false);
												}
												setIsReplying(true);
											}}
										>
											<MessageSquare className="mr-1 h-3.5 w-3.5" />
											Reply
										</Button>
										{showShare && (
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="h-7 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground"
													>
														<Share2 className="mr-1 h-3.5 w-3.5" />
														Share
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent
													align="start"
													className="min-w-44"
												>
													<DropdownMenuItem
														onClick={() =>
															void copyThreadLink()
														}
													>
														<Copy className="mr-2 h-4 w-4" />
														Copy link
													</DropdownMenuItem>
													<DropdownMenuItem asChild>
														<Link
															href={threadHref}
															className="flex cursor-pointer items-center"
														>
															<Share2 className="mr-2 h-4 w-4" />
															Open thread
														</Link>
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										)}
										{showEarlyContinueThread && (
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="h-7 rounded-md border-zinc-400/55 px-2.5 text-xs font-medium dark:border-zinc-500/60"
												asChild
											>
												<Link href={threadHref}>
													<ExternalLink
														className="mr-1 h-3.5 w-3.5"
														aria-hidden
													/>
													Continue this thread
												</Link>
											</Button>
										)}
									</div>
								)}
							</CommentItemMeta>

							{isReplying &&
								!isEditing &&
								!comment.isDeleted &&
								(!isCollapsed || !showReplyToggle) && (
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
						</div>
					</div>

					{showReplyToggle ? (
						<div
							className={cn(
								"grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
								isCollapsed
									? "grid-rows-[0fr]"
									: "grid-rows-[1fr]",
							)}
						>
							<div
								className="min-h-0"
								style={{
									overflowX: "visible",
									overflowY: "clip",
								}}
							>
								<ThreadRepliesList>
									{replies.map((reply) =>
										depth < maxDepth ? (
											<CommentItem
												key={reply._id}
												comment={reply}
												blogId={blogId}
												slug={slug}
												user={user}
												depth={depth + 1}
												onDelete={() =>
													removeReply(reply._id)
												}
												onTotalChange={onTotalChange}
												blogAuthorId={blogAuthorId}
											/>
										) : (
											<div
												key={reply._id}
												className="flex flex-wrap items-center gap-2 py-1 pl-1"
											>
												<p className="text-xs text-muted-foreground">
													Reply depth limit — open
													the rest on its own page.
												</p>
												<Button
													type="button"
													variant="outline"
													size="sm"
													className="h-7 border-zinc-400/55 text-xs dark:border-zinc-500/60"
													asChild
												>
													<Link
														href={`/blogs/${slug}/thread/${reply._id}`}
													>
														<ExternalLink
															className="mr-1 h-3.5 w-3.5"
															aria-hidden
														/>
														Continue this thread
													</Link>
												</Button>
											</div>
										),
									)}

									{hasMoreReplies && depth < maxDepth && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="h-7 rounded-md px-2 text-xs text-primary"
											onClick={() =>
												void loadMoreReplies()
											}
											disabled={isLoadingReplies}
										>
											{isLoadingReplies
												? "Loading…"
												: "Load more replies"}
										</Button>
									)}
								</ThreadRepliesList>
							</div>
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
