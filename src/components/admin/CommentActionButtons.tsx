"use client";

import { useState } from "react";
import { deleteComment, toggleCommentApproval } from "@/actions/comment";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface CommentActionButtonsProps {
	commentId: string;
	blogId: string;
	isApproved: boolean;
}

export function CommentActionButtons({
	commentId,
	blogId,
	isApproved,
}: CommentActionButtonsProps) {
	const [isToggling, setIsToggling] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleToggleApproval = async () => {
		setIsToggling(true);
		try {
			const result = await toggleCommentApproval(commentId);
			if (result.success) {
				toast.success(isApproved ? "Comment unapproved" : "Comment approved");
			} else {
				toast.error(result.error || "Failed to update status");
			}
		} catch (error) {
			console.error("[toggleApproval] Error:", error);
			toast.error("An unexpected error occurred");
		} finally {
			setIsToggling(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm("Are you sure you want to delete this comment permanently?"))
			return;

		setIsDeleting(true);
		try {
			const result = await deleteComment(commentId, blogId);
			if (result.success) {
				toast.success("Comment deleted permanently");
			} else {
				toast.error(result.error || "Failed to delete comment");
			}
		} catch (error) {
			console.error("[deleteComment] Error:", error);
			toast.error("An unexpected error occurred");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="flex items-center justify-end gap-1">
			<Button
				variant="ghost"
				size="icon"
				onClick={handleToggleApproval}
				disabled={isToggling || isDeleting}
				className={`h-8 w-8 ${isApproved ? "text-amber-500 hover:text-amber-600" : "text-emerald-500 hover:text-emerald-600"}`}
				title={isApproved ? "Unapprove" : "Approve"}
			>
				{isToggling ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : isApproved ? (
					<XCircle size={16} />
				) : (
					<CheckCircle size={16} />
				)}
			</Button>

			<Button
				variant="ghost"
				size="icon"
				onClick={handleDelete}
				disabled={isToggling || isDeleting}
				className="h-8 w-8 text-destructive hover:text-red-600"
				title="Delete Permanent"
			>
				{isDeleting ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<Trash2 size={16} />
				)}
			</Button>
		</div>
	);
}
