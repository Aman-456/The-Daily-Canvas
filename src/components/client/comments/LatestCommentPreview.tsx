"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";
import type { PublicComment } from "@/types/comment";

type Props = {
	latest: PublicComment;
};

/** Shown while the thread is not fetched yet — lightweight teaser. */
export function LatestCommentPreview({ latest }: Props) {
	const preview = latest.content.replace(/^"|"$/g, "").slice(0, 160);
	const suffix = latest.content.length > 160 ? "…" : "";

	return (
		<div className="rounded-lg border border-border/50 bg-muted/15 p-4 text-sm">
			<p className="mb-2 text-xs font-semibold text-muted-foreground">
				Latest activity
			</p>
			<div className="flex gap-3">
				<Avatar className="h-8 w-8 shrink-0 border border-border/60">
					<AvatarImage src={latest.userId?.image ?? undefined} alt="" />
					<AvatarFallback>
						{latest.userId?.name?.charAt(0) ?? "?"}
					</AvatarFallback>
				</Avatar>
				<div className="min-w-0 flex-1">
					<div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
						<span className="font-semibold">
							{latest.userId?.name ?? "Someone"}
						</span>
						<span className="text-xs text-muted-foreground">
							{formatRelativeTime(latest.createdAt)}
						</span>
					</div>
					<p className="text-muted-foreground leading-relaxed">
						{preview}
						{suffix}
					</p>
				</div>
			</div>
		</div>
	);
}
