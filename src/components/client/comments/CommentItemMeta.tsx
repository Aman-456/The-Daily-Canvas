"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { PublicComment } from "@/types/comment";

type Props = {
	comment: PublicComment;
	blogAuthorId?: string;
	showEditInDropdown: boolean;
	showDeleteInDropdown: boolean;
	onEditRequest: () => void;
	onDeleteRequest: () => void;
	children?: ReactNode;
};

export function CommentItemMeta({
	comment,
	blogAuthorId,
	showEditInDropdown,
	showDeleteInDropdown,
	onEditRequest,
	onDeleteRequest,
	children,
}: Props) {
	const showMenu = showEditInDropdown || showDeleteInDropdown;
	return (
		<div className="flex gap-3">
			<Avatar className="h-8 w-8 shrink-0 border border-border/60">
				<AvatarImage
					src={comment.isDeleted ? undefined : (comment.userId?.image ?? undefined)}
					alt=""
				/>
				<AvatarFallback>
					{comment.isDeleted ? "—" : (comment.userId?.name?.charAt(0) ?? "?")}
				</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1 space-y-2">
				<div className="flex items-start justify-between gap-2">
					<div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
						<span className="font-semibold">
							{comment.isDeleted
								? "[deleted]"
								: (comment.userId?.name ?? "Deleted user")}
						</span>
						{comment.userId?._id === blogAuthorId && !comment.isDeleted && (
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
							{new Date(comment.createdAt).toLocaleString()}
						</time>
						{comment.isEdited && (
							<span className="text-xs italic text-muted-foreground">
								(edited)
							</span>
						)}
					</div>

					{showMenu && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
									aria-label="Comment actions"
								>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{showEditInDropdown && (
									<DropdownMenuItem onClick={onEditRequest}>
										<Edit2 className="mr-2 h-4 w-4" />
										Edit
									</DropdownMenuItem>
								)}
								{showDeleteInDropdown && (
									<DropdownMenuItem
										onClick={onDeleteRequest}
										className="text-destructive focus:text-destructive"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
				{children}
			</div>
		</div>
	);
}
