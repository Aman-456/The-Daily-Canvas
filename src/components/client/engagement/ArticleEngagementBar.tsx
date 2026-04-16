"use client";

import { useTransition } from "react";
import { Flag, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { VoteButtons } from "@/components/client/engagement/VoteButtons";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleArticleVote } from "@/actions/vote";
import { reportArticle } from "@/actions/report";
import { cn } from "@/lib/utils";
import { redditActionButtonClass } from "@/lib/reddit-action-styles";

type Props = {
	score: number;
	myVote: 1 | -1 | 0;
	blogId: string;
	slug: string;
	/** Logged-in user is the article author — vote read-only; no report. */
	isOwner: boolean;
	className?: string;
};

/** Matches comment row: readers get bare `xs` votes + ⋯ Report; author sees no vote/report UI. */
export function ArticleEngagementBar({
	score,
	myVote,
	blogId,
	slug,
	isOwner,
	className,
}: Props) {
	const [reportPending, startTransition] = useTransition();

	if (isOwner) {
		return null;
	}

	const runReportArticle = () => {
		const reason =
			(window.prompt("Report reason (e.g. spam, abuse, other):", "spam") || "")
				.trim() || "other";
		const details =
			(window.prompt("Optional details (can be blank):", "") || "").trim();
		startTransition(async () => {
			const fd = new FormData();
			fd.set("blogId", blogId);
			fd.set("slug", slug);
			fd.set("reason", reason);
			if (details) fd.set("details", details);
			const res = await reportArticle(fd);
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

	return (
		<div
			className={cn(
				"flex w-full shrink-0 flex-wrap items-center justify-end pt-0.5 sm:pt-0 sm:w-auto",
				className,
			)}
		>
			<span className="mr-3 inline-flex items-center">
				<VoteButtons
					variant="bare"
					size="xs"
					score={score}
					myVote={myVote}
					onVote={(value) => toggleArticleVote({ blogId, value, slug })}
				/>
			</span>
			<div className="flex items-center gap-x-0.5">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="xs"
							disabled={reportPending}
							className={cn(redditActionButtonClass, "px-1.5")}
							aria-label="More options"
						>
							<MoreHorizontal className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="min-w-40">
						<DropdownMenuItem onClick={() => runReportArticle()}>
							<Flag className="mr-2 h-4 w-4" />
							Report
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
