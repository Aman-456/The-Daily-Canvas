"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { addComment, updateComment, deleteComment } from "@/actions/comment";
import { toggleCommentVote } from "@/actions/vote";
import { reportComment } from "@/actions/report";
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
	Edit2,
	ExternalLink,
	Flag,
	Loader2,
	MessageSquare,
	Minus,
	MoreHorizontal,
	Plus,
	Share2,
	Trash2,
} from "lucide-react";
import { cn, isAdmin } from "@/lib/utils";
import type { Session } from "next-auth";
import { useCommentReplies } from "@/hooks/useCommentReplies";
import { CommentItemMeta } from "@/components/client/comments/CommentItemMeta";
import { CommentItemInlineReply } from "@/components/client/comments/CommentItemInlineReply";
import { VoteButtons } from "@/components/client/engagement/VoteButtons";
import {
	ThreadCollapseToggle,
	ThreadConnector,
	ThreadRepliesList,
	ThreadSpine,
	THREAD_STEP_PX,
} from "@/components/client/comments/CommentThreadGutter";
import { absoluteUrl } from "@/lib/json-ld";
import {
	redditActionButtonClass,
	redditActionButtonDangerClass,
} from "@/lib/reddit-action-styles";
import type { PublicComment } from "@/types/comment";

function authorIdFromComment(comment: PublicComment): string | undefined {
	const uid = comment.userId as unknown;
	if (typeof uid === "string") {
		const t = uid.trim();
		return t || undefined;
	}
	if (!uid || typeof uid !== "object") return undefined;
	const o = uid as { _id?: string | null; id?: string | null };
	const a = typeof o._id === "string" ? o._id.trim() : "";
	const b = typeof o.id === "string" ? o.id.trim() : "";
	return a || b || undefined;
}

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
	const [localSoftDeleted, setLocalSoftDeleted] = useState(false);
	const [localHardRemoved, setLocalHardRemoved] = useState(false);
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

	const authorId = authorIdFromComment(comment);
	const isOwner = Boolean(user?.id && authorId && user.id === authorId);
	const isAdminRole = isAdmin(user?.role);
	const displayDeleted = comment.isDeleted || localSoftDeleted;
	const showOwnerOrAdminActions =
		(isOwner || isAdminRole) && !isEditing && !displayDeleted;

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
					const hasReplies =
						(comment.replyCount ?? 0) > 0 || replies.length > 0;
					if (hasReplies) {
						setLocalSoftDeleted(true);
					} else {
						onDelete?.();
						if (onDelete === undefined) setLocalHardRemoved(true);
						onTotalChange?.(-1);
					}
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
		!displayDeleted &&
		showReplyToggle &&
		depth >= maxInlineDepth - 1;

	const collapseLabel = isCollapsed
		? `Expand ${visibleReplyCount} ${visibleReplyCount === 1 ? "reply" : "replies"}`
		: `Collapse ${visibleReplyCount} ${visibleReplyCount === 1 ? "reply" : "replies"}`;

	const threadHref = `/articles/${slug}/thread/${comment._id}`;
	const showShare = !hidePermalink && !displayDeleted;
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

	const runReportComment = () => {
		const reason =
			(window.prompt("Report reason (e.g. spam, abuse, other):", "spam") || "")
				.trim() || "other";
		const details =
			(window.prompt("Optional details (can be blank):", "") || "").trim();
		startTransition(async () => {
			const fd = new FormData();
			fd.set("commentId", comment._id);
			fd.set("slug", slug);
			fd.set("reason", reason);
			if (details) fd.set("details", details);
			const res = await reportComment(fd);
			if (!res.success) {
				toast.error(res.error || "Could not submit report");
				return;
			}
			const count = res.data?.reportsCount ?? 0;
			if (res.data?.hidden) {
				toast.success(`Reported. Auto-hidden at ${count} reports.`);
			} else {
				toast.success(`Reported. (${count} open reports)`);
			}
		});
	};

	const toggleIcon = isLoadingReplies ? (
		<Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
	) : isCollapsed ? (
		<Plus className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />
	) : (
		<Minus className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />
	);

	const hasGutter = showReplyToggle || depth > 0;

	if (localHardRemoved) {
		return null;
	}

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
											displayDeleted
												? undefined
												: (comment.userId?.image ?? undefined)
										}
										alt=""
									/>
									<AvatarFallback>
										{displayDeleted
											? "—"
											: (comment.userId?.name?.charAt(0) ?? "?")}
									</AvatarFallback>
								</Avatar>

								<div className="min-w-0 flex-1 space-y-2">
							<CommentItemMeta
								comment={comment}
								blogAuthorId={blogAuthorId}
								showAvatar={false}
								treatAsDeleted={localSoftDeleted}
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
										{displayDeleted ? "[deleted]" : displayContent}
									</p>
								)}

								{!isEditing && !displayDeleted && (
									<div className="flex flex-wrap items-center pt-1.5">
										<span className="mr-3 inline-flex items-center">
											{isOwner ? (
												<VoteButtons
													readOnly
													variant="bare"
													size="xs"
													score={Number(comment.voteScore ?? 0)}
													myVote={0}
												/>
											) : (
												<VoteButtons
													variant="bare"
													size="xs"
													score={Number(comment.voteScore ?? 0)}
													myVote={(comment.myVote ?? 0) as 1 | -1 | 0}
													onVote={(value) =>
														toggleCommentVote({
															commentId: comment._id,
															value,
															slug,
														})
													}
												/>
											)}
										</span>
										<div className="flex flex-wrap items-center gap-x-0.5 gap-y-1">
										<Button
											type="button"
											variant="ghost"
											size="xs"
											className={redditActionButtonClass}
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
											<MessageSquare className="size-3.5" />
											Reply
										</Button>
										{showShare && (
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														type="button"
														variant="ghost"
														size="xs"
														className={redditActionButtonClass}
													>
														<Share2 className="size-3.5" />
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
										{isOwner && showOwnerOrAdminActions ? (
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														type="button"
														variant="ghost"
														size="xs"
														disabled={isPending}
														className={cn(
															redditActionButtonClass,
															"px-1.5",
														)}
														aria-label="More options"
													>
														<MoreHorizontal className="size-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="start" className="min-w-40">
													<DropdownMenuItem
														onClick={() => {
															setEditContent(
																lastSavedBody ?? comment.content,
															);
															setIsEditing(true);
														}}
													>
														<Edit2 className="mr-2 h-4 w-4" />
														Edit
													</DropdownMenuItem>
													<DropdownMenuItem
														className={redditActionButtonDangerClass}
														onClick={() => void handleDelete()}
													>
														<Trash2 className="mr-2 h-4 w-4" />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										) : !isOwner && isAdminRole && showOwnerOrAdminActions ? (
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														type="button"
														variant="ghost"
														size="xs"
														disabled={isPending}
														className={cn(
															redditActionButtonClass,
															"px-1.5",
														)}
														aria-label="More options"
													>
														<MoreHorizontal className="size-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="start" className="min-w-40">
													<DropdownMenuItem
														className={redditActionButtonDangerClass}
														onClick={() => void handleDelete()}
													>
														<Trash2 className="mr-2 h-4 w-4" />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										) : (
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														type="button"
														variant="ghost"
														size="xs"
														className={cn(
															redditActionButtonClass,
															"px-1.5",
														)}
														aria-label="More options"
													>
														<MoreHorizontal className="size-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="start" className="min-w-40">
													<DropdownMenuItem onClick={() => runReportComment()}>
														<Flag className="mr-2 h-4 w-4" />
														Report
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										)}
										{showEarlyContinueThread && (
											<Button
												type="button"
												variant="ghost"
												size="xs"
												className={redditActionButtonClass}
												asChild
											>
												<Link href={threadHref}>
													<ExternalLink
														className="size-3.5"
														aria-hidden
													/>
													Continue this thread
												</Link>
											</Button>
										)}
										</div>
									</div>
								)}
							</CommentItemMeta>

							{isReplying &&
								!isEditing &&
								!displayDeleted &&
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
													variant="ghost"
													size="xs"
													className={redditActionButtonClass}
													asChild
												>
													<Link
														href={`/articles/${slug}/thread/${reply._id}`}
													>
														<ExternalLink
															className="size-3.5"
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
											size="xs"
											className={cn(
												redditActionButtonClass,
												"text-primary hover:bg-primary/10 hover:text-primary",
											)}
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
