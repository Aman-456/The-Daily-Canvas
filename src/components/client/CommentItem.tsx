"use client";

import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
	addComment,
	updateComment,
	deleteComment,
	getReplies,
} from "@/actions/comment";
import { toast } from "sonner";
import {
	MessageSquare,
	Edit2,
	Trash2,
	MoreHorizontal,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isAdmin } from "@/lib/utils";

interface CommentItemProps {
	comment: any;
	blogId: string;
	slug: string;
	user: any;
	depth?: number;
	onDelete?: () => void;
	onTotalChange?: (delta: number) => void;
	blogAuthorId?: string;
}

export function CommentItem({
	comment,
	blogId,
	slug,
	user,
	depth = 0,
	onDelete,
	onTotalChange,
	blogAuthorId,
}: CommentItemProps) {
	const [isReplying, setIsReplying] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(true);
	const [replyContent, setReplyContent] = useState("");
	const [editContent, setEditContent] = useState(comment.content);
	const [isPending, startTransition] = useTransition();

	const [replies, setReplies] = useState<any[]>(comment.replies || []);
	const [replyPage, setReplyPage] = useState(1);
	const [hasMoreReplies, setHasMoreReplies] = useState(
		comment.replyCount > (comment.replies?.length || 0),
	);
	const [isLoadingReplies, setIsLoadingReplies] = useState(false);

	const isOwner =
		user?.id === comment.userId?._id || user?.id === comment.userId;
	const isAdminRole = isAdmin(user?.role);

	const handleReplyDelete = (replyId: string) => {
		setReplies((prev) => prev.filter((r) => r._id !== replyId));
	};

	const loadMoreReplies = async () => {
		setIsLoadingReplies(true);
		try {
			const nextPage = replyPage + 1;
			const lastTimestamp =
				replies.length > 0 ? replies[replies.length - 1].createdAt : undefined;

			const result = await getReplies(comment._id, nextPage, 10, lastTimestamp);
			if (result.success && result.data) {
				const newReplies = result.data.replies;
				setReplies((prev) => {
					const existingIds = new Set(prev.map((r) => r._id));
					const uniqueNew = newReplies.filter(
						(r: any) => !existingIds.has(r._id),
					);
					return [...prev, ...uniqueNew];
				});
				setHasMoreReplies(result.data.hasMore);
				setReplyPage(nextPage);
			}
		} catch (error) {
			toast.error("Failed to load more replies");
		} finally {
			setIsLoadingReplies(false);
		}
	};

	const toggleCollapse = async () => {
		const newCollapsed = !isCollapsed;
		setIsCollapsed(newCollapsed);

		if (!newCollapsed && replies.length === 0 && comment.replyCount > 0) {
			setIsLoadingReplies(true);
			try {
				const result = await getReplies(comment._id, 1);
				if (result.success && result.data) {
					setReplies(result.data.replies);
					setHasMoreReplies(result.data.hasMore);
					setReplyPage(1);
				}
			} catch (error) {
				toast.error("Failed to load replies");
			} finally {
				setIsLoadingReplies(false);
			}
		}
	};

	const handleReply = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!replyContent.trim()) return;

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
					toast.success("Reply added!");

					// Optimistically add to replies and ensure they're shown
					setReplies((prev) => [...prev, result.data]);
					setIsCollapsed(false);
					setHasMoreReplies(true); // At least one reply now
					if (onTotalChange) onTotalChange(1);
				} else {
					toast.error(result.error || "Failed to add reply");
				}
			} catch (error: any) {
				toast.error("An unexpected error occurred");
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
					toast.success("Comment updated!");
				} else {
					toast.error(result.error || "Failed to update comment");
				}
			} catch (error: any) {
				toast.error("An unexpected error occurred");
			}
		});
	};

	const handleDelete = async () => {
		if (!confirm("Are you sure you want to delete this comment?")) return;

		startTransition(async () => {
			try {
				const result = await deleteComment(comment._id, blogId, slug);
				if (result.success) {
					toast.success("Comment deleted!");
					if (onDelete) onDelete();
					if (onTotalChange) onTotalChange(-1);
				} else {
					toast.error(result.error || "Failed to delete comment");
				}
			} catch (error: any) {
				toast.error("An unexpected error occurred");
			}
		});
	};

	const maxDepth = 6; // Limit visual nesting depth
	const hasReplies = comment.replies && comment.replies.length > 0;

	return (
		<div
			className={`group space-y-2 border-l-2 border-zinc-200 dark:border-zinc-800 hover:border-primary/30 transition-colors ${depth > 0 ? "ml-4 md:ml-8 pt-2 pl-4 md:pl-6" : "pl-4"}`}
		>
			<div className="flex gap-3">
				<Avatar className="h-8 w-8 border shrink-0">
					<AvatarImage
						src={comment.isDeleted ? undefined : comment.userId?.image}
					/>
					<AvatarFallback>
						{comment.isDeleted ? "D" : (comment.userId?.name?.charAt(0) || "D")}
					</AvatarFallback>
				</Avatar>
				<div className="flex-1 space-y-1">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="font-bold text-sm">
								{comment.isDeleted ? "[deleted]" : (comment.userId?.name || "Deleted User")}
							</span>
							{comment.userId?._id === blogAuthorId && (
								<span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
									Admin
								</span>
							)}
							<span className="text-[10px] text-muted-foreground">•</span>
							<span className="text-[10px] text-muted-foreground">
								{new Date(comment.createdAt).toLocaleDateString()}
							</span>
							{comment.isEdited && (
								<span className="text-[10px] text-muted-foreground italic font-medium">
									(edited)
								</span>
							)}
						</div>
						{(isOwner || isAdminRole) && !isEditing && !comment.isDeleted && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
									>
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{isOwner && (
										<DropdownMenuItem onClick={() => setIsEditing(true)}>
											<Edit2 className="h-4 w-4 mr-2" />
											Edit
										</DropdownMenuItem>
									)}
									<DropdownMenuItem
										onClick={handleDelete}
										className="text-destructive focus:text-destructive"
									>
										<Trash2 className="h-4 w-4 mr-2" />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>

					{isEditing ? (
						<form onSubmit={handleUpdate} className="space-y-2 pt-1">
							<Textarea
								value={editContent}
								onChange={(e) => setEditContent(e.target.value)}
								className="min-h-[80px] text-sm bg-muted/20 focus-visible:ring-primary/20"
								autoFocus
							/>
							<div className="flex justify-end gap-2">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => {
										setIsEditing(false);
										setEditContent(comment.content);
									}}
									className="rounded-full h-8 text-xs"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									size="sm"
									disabled={isPending || !editContent.trim()}
									className="rounded-full px-4 h-8 text-xs"
								>
									{isPending ? "Updating..." : "Update"}
								</Button>
							</div>
						</form>
					) : (
						<p className="text-sm leading-relaxed text-foreground/90">
							{comment.content}
						</p>
					)}

					{!isEditing && user && (
						<div className="flex items-center gap-2 pt-1">
							{!comment.isDeleted && (
								<Button
									variant="ghost"
									size="sm"
									className="h-7 px-2 text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
									onClick={() => setIsReplying(!isReplying)}
								>
									<MessageSquare className="h-3 w-3 mr-1.5" />
									Reply
								</Button>
							)}

							{(comment.replyCount > 0 || replies.length > 0) && (
								<Button
									variant="ghost"
									size="sm"
									className="h-7 px-2 text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
									onClick={toggleCollapse}
								>
									{isCollapsed ? (
										<>
											<ChevronDown className="h-3 w-3 mr-1.5" />
											Show {comment.replyCount || replies.length}{" "}
											{comment.replyCount === 1 ? "reply" : "replies"}
										</>
									) : (
										<>
											<ChevronUp className="h-3 w-3 mr-1.5" />
											Hide replies
										</>
									)}
								</Button>
							)}
						</div>
					)}
				</div>
			</div>

			{isReplying && !isEditing && !comment.isDeleted && (
				<form onSubmit={handleReply} className="ml-11 mt-2 space-y-2">
					<Textarea
						placeholder={`Replying to ${comment.userId?.name}...`}
						value={replyContent}
						onChange={(e) => setReplyContent(e.target.value)}
						className="min-h-[80px] text-sm bg-muted/20 focus-visible:ring-primary/20"
						autoFocus
					/>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setIsReplying(false)}
							className="rounded-full h-8 text-xs"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							disabled={isPending || !replyContent.trim()}
							className="rounded-full px-4 h-8 text-xs"
						>
							{isPending ? "Posting..." : "Post Reply"}
						</Button>
					</div>
				</form>
			)}

			{!isCollapsed && (
				<div className="space-y-2 mt-2">
					{replies.map((reply: any) => (
						<CommentItem
							key={reply._id}
							comment={reply}
							blogId={blogId}
							slug={slug}
							user={user}
							depth={depth + 1}
							onDelete={() => handleReplyDelete(reply._id)}
							onTotalChange={onTotalChange}
							blogAuthorId={blogAuthorId}
						/>
					))}

					{hasMoreReplies && (
						<div className="ml-11 py-1">
							<Button
								variant="ghost"
								size="sm"
								onClick={loadMoreReplies}
								disabled={isLoadingReplies}
								className="text-xs text-primary hover:bg-primary/5 h-7 rounded-full px-3"
							>
								{isLoadingReplies ? "Loading..." : "Load more replies"}
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
