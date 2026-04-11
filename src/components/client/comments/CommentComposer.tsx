"use client";

import Link from "next/link";
import type { Session } from "next-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
	sessionUser: Session["user"] | undefined;
	content: string;
	onContentChange: (value: string) => void;
	isPending: boolean;
	onSubmitLoggedIn: (e: React.FormEvent<HTMLFormElement>) => void;
	signInHref: string;
};

export function CommentComposer({
	sessionUser,
	content,
	onContentChange,
	isPending,
	onSubmitLoggedIn,
	signInHref,
}: Props) {
	const isLoggedIn = Boolean(sessionUser);

	return (
		<div className="rounded-lg border border-border/80 bg-card/40 p-3 shadow-sm md:p-4">
			<p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				{isLoggedIn
					? `Comment as ${sessionUser?.name ?? "you"}`
					: "Join the conversation"}
			</p>

			{isLoggedIn ? (
				<form
					onSubmit={onSubmitLoggedIn}
					className="flex flex-col gap-3 sm:flex-row sm:items-start"
				>
					<Avatar className="hidden h-9 w-9 shrink-0 border border-border/60 sm:flex">
						<AvatarImage src={sessionUser?.image ?? ""} alt="" />
						<AvatarFallback>
							{sessionUser?.name?.charAt(0) ?? "?"}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1 space-y-3">
						<Textarea
							id="comment-form"
							name="comment-body"
							value={content}
							onChange={(e) => onContentChange(e.target.value)}
							placeholder="What are your thoughts?"
							disabled={isPending}
							rows={4}
							className="min-h-[100px] resize-y bg-background text-sm"
						/>
						<div className="flex justify-end">
							<Button
								type="submit"
								size="sm"
								disabled={isPending || !content.trim()}
								className="min-w-[7rem] rounded-full font-semibold"
							>
								{isPending ? "Posting…" : "Comment"}
							</Button>
						</div>
					</div>
				</form>
			) : (
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start">
					<Avatar className="hidden h-9 w-9 shrink-0 border border-dashed border-muted-foreground/40 bg-muted/30 sm:flex">
						<AvatarFallback className="text-xs text-muted-foreground">
							?
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1 space-y-3">
						<Textarea
							id="comment-form"
							value={content}
							readOnly
							disabled
							placeholder="Log in to comment. You can read the thread below once it loads."
							rows={4}
							className={cn(
								"min-h-[100px] cursor-not-allowed resize-none bg-muted/40 text-sm text-muted-foreground",
							)}
						/>
						<div className="flex justify-end">
							<Button size="sm" className="rounded-full font-semibold" asChild>
								<Link href={signInHref}>Log in to comment</Link>
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
