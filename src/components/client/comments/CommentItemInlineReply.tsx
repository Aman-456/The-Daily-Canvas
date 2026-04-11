"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Session } from "next-auth";

type Props = {
	replyName: string | null | undefined;
	replyContent: string;
	onReplyContentChange: (v: string) => void;
	isPending: boolean;
	onSubmit: (e: React.FormEvent) => void;
	onCancel: () => void;
	sessionUser: Session["user"] | undefined;
	signInHref: string;
};

export function CommentItemInlineReply({
	replyName,
	replyContent,
	onReplyContentChange,
	isPending,
	onSubmit,
	onCancel,
	sessionUser,
	signInHref,
}: Props) {
	const isLoggedIn = Boolean(sessionUser);

	return (
		<div className="ml-11 mt-2 space-y-2 border-l-2 border-border/50 pl-3">
			{isLoggedIn ? (
				<form onSubmit={onSubmit} className="space-y-2">
					<Textarea
						placeholder={`Reply to ${replyName ?? "this thread"}…`}
						value={replyContent}
						onChange={(e) => onReplyContentChange(e.target.value)}
						disabled={isPending}
						rows={3}
						className="min-h-[72px] resize-y bg-background text-sm"
						autoFocus
					/>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-8 rounded-full text-xs"
							onClick={onCancel}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							className="h-8 rounded-full px-4 text-xs font-semibold"
							disabled={isPending || !replyContent.trim()}
						>
							{isPending ? "Posting…" : "Reply"}
						</Button>
					</div>
				</form>
			) : (
				<div className="space-y-2">
					<Textarea
						placeholder="Log in to reply."
						value=""
						readOnly
						disabled
						rows={3}
						className={cn(
							"min-h-[72px] cursor-not-allowed resize-none bg-muted/40 text-sm text-muted-foreground",
						)}
					/>
					<div className="flex flex-wrap justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-8 rounded-full text-xs"
							onClick={onCancel}
						>
							Cancel
						</Button>
						<Button size="sm" className="h-8 rounded-full text-xs font-semibold" asChild>
							<Link href={signInHref}>Log in to reply</Link>
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
