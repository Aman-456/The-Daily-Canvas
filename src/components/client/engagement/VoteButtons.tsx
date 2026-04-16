"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowBigDown, ArrowBigUp, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
	score: number;
	myVote: 1 | -1 | 0;
	onVote?: (value: 1 | -1) => Promise<{
		success: boolean;
		error?: string;
		data?: { score: number; myVote: 1 | -1 | 0 };
	}>;
	size?: "xs" | "sm" | "md";
	/** When true, shows score only (e.g. author viewing own article/comment). */
	readOnly?: boolean;
	/**
	 * `reddit` — narrow vertical rail (up / score / down), common on thread UIs.
	 * `inline` — horizontal control, closer to a compact “toolbar” vote.
	 * `chip` — single horizontal pill (tag-style) with chevrons + score.
	 * `bare` — borderless row (chevron up / score / chevron down), Reddit-style action bar.
	 */
	variant?: "inline" | "reddit" | "chip" | "bare";
};

const voteHit =
	"inline-flex cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function VoteButtons({
	score,
	myVote,
	onVote,
	size = "sm",
	readOnly,
	variant = "inline",
}: Props) {
	const [localScore, setLocalScore] = useState(score);
	const [localMyVote, setLocalMyVote] = useState(myVote);
	const [pending, start] = useTransition();

	useEffect(() => {
		setLocalScore(score);
		setLocalMyVote(myVote);
	}, [score, myVote]);

	const isReddit = variant === "reddit";
	const isChip = variant === "chip";
	const isBare = variant === "bare";
	const isXs = size === "xs";
	const iconSize = isBare
		? isXs
			? 16
			: 18
		: isChip
			? size === "md"
				? 18
				: isXs
					? 12
					: 14
			: isReddit
				? size === "md"
					? 22
					: isXs
						? 16
						: 20
				: size === "md"
					? 18
					: isXs
						? 14
						: 16;
	const btnReddit = cn(
		voteHit,
		size === "md" ? "h-8 w-8" : isXs ? "h-6 w-6" : "h-7 w-7",
	);
	const btnInline =
		size === "md"
			? "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border/60 bg-muted/20 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-60"
			: isXs
				? "inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-border/60 bg-muted/20 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-60"
				: "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border/60 bg-muted/20 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-60";

	const UpIcon = isReddit || isChip || isBare ? ChevronUp : ArrowBigUp;
	const DownIcon = isReddit || isChip || isBare ? ChevronDown : ArrowBigDown;

	const bareBtn = cn(
		"inline-flex shrink-0 cursor-pointer items-center justify-center rounded p-0 text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
		isXs ? "size-6" : "size-7",
	);

	const chipShell = cn(
		"inline-flex items-center gap-0 rounded-full bg-primary/10 px-1 text-xs font-medium text-primary/90 ring-1 ring-primary/15",
		isXs ? "h-6" : "h-7",
	);
	const chipBtn = cn(
		"inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full text-primary/90 transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:opacity-50",
		isXs ? "size-5" : "size-6",
	);

	if (readOnly) {
		if (isChip) {
			return (
				<div
					className={cn(chipShell, "cursor-default opacity-90")}
					title="You cannot vote on your own content"
				>
					<span className={cn(chipBtn, "pointer-events-none opacity-50")} aria-hidden>
						<UpIcon size={iconSize} strokeWidth={2.25} />
					</span>
					<span className="min-w-6 px-0.5 text-center text-xs font-bold tabular-nums text-primary/90">
						{localScore}
					</span>
					<span className={cn(chipBtn, "pointer-events-none opacity-50")} aria-hidden>
						<DownIcon size={iconSize} strokeWidth={2.25} />
					</span>
					<span className="sr-only">Score. Voting is disabled on your own posts.</span>
				</div>
			);
		}
		if (isBare) {
			return (
				<div
					className="inline-flex cursor-default items-center gap-0 text-muted-foreground/70"
					title="You cannot vote on your own content"
				>
					<span className={cn(bareBtn, "pointer-events-none opacity-40")} aria-hidden>
						<ChevronUp size={iconSize} strokeWidth={2.25} />
					</span>
					<span className="min-w-[1.35rem] px-0.5 text-center text-xs font-medium tabular-nums text-muted-foreground">
						{localScore}
					</span>
					<span className={cn(bareBtn, "pointer-events-none opacity-40")} aria-hidden>
						<ChevronDown size={iconSize} strokeWidth={2.25} />
					</span>
					<span className="sr-only">Score. Voting is disabled on your own posts.</span>
				</div>
			);
		}
		if (isReddit) {
			return (
				<div
					className="flex w-full flex-col items-center gap-0.5 text-muted-foreground/50"
					title="You cannot vote on your own content"
				>
					<span className={cn(btnReddit, "pointer-events-none opacity-40")}>
						<UpIcon size={iconSize} strokeWidth={2.25} aria-hidden />
					</span>
					<span className="min-h-5 min-w-7 px-0.5 text-center text-xs font-bold tabular-nums leading-none text-foreground/80">
						{localScore}
					</span>
					<span className={cn(btnReddit, "pointer-events-none opacity-40")}>
						<DownIcon size={iconSize} strokeWidth={2.25} aria-hidden />
					</span>
					<span className="sr-only">Score. Voting is disabled on your own posts.</span>
				</div>
			);
		}
		return (
			<div
				className={cn(
					"inline-flex items-center rounded-lg border border-border/60 bg-muted/10 text-muted-foreground",
					isXs ? "gap-1 px-1.5 py-0.5" : "gap-1.5 px-2 py-1",
					size === "md" && "px-2.5 py-1.5",
				)}
				title="You cannot vote on your own content"
			>
				<span
					className={cn(
						"text-center font-semibold tabular-nums text-foreground",
						isXs ? "min-w-5 text-xs" : "min-w-8 text-sm",
					)}
				>
					{localScore}
				</span>
				<span className="sr-only">Score. Voting is disabled on your own posts.</span>
			</div>
		);
	}

	if (!onVote) {
		return null;
	}

	const upSelected = localMyVote === 1;
	const downSelected = localMyVote === -1;

	const applyVoteResult = (res: {
		success: boolean;
		data?: { score: number; myVote: 1 | -1 | 0 };
	}) => {
		if (res.success && res.data) {
			setLocalScore(res.data.score);
			setLocalMyVote(res.data.myVote);
		}
	};

	if (isChip && onVote) {
		return (
			<div className={chipShell} role="group" aria-label="Vote">
				<button
					type="button"
					disabled={pending}
					className={cn(chipBtn, upSelected && "bg-primary/25 text-primary")}
					aria-label="Upvote"
					aria-pressed={upSelected}
					onClick={() =>
						start(async () => {
							const res = await onVote(1);
							if (!res.success) toast.error(res.error || "Could not vote");
							else applyVoteResult(res);
						})
					}
				>
					<UpIcon size={iconSize} strokeWidth={2.25} aria-hidden />
				</button>
				<span
					className={cn(
						"min-w-6 px-0.5 text-center text-xs font-bold tabular-nums text-primary/90",
						upSelected && "text-primary",
						downSelected && "text-destructive",
					)}
				>
					{localScore}
				</span>
				<button
					type="button"
					disabled={pending}
					className={cn(
						chipBtn,
						downSelected && "bg-destructive/15 text-destructive hover:bg-destructive/25",
					)}
					aria-label="Downvote"
					aria-pressed={downSelected}
					onClick={() =>
						start(async () => {
							const res = await onVote(-1);
							if (!res.success) toast.error(res.error || "Could not vote");
							else applyVoteResult(res);
						})
					}
				>
					<DownIcon size={iconSize} strokeWidth={2.25} aria-hidden />
				</button>
			</div>
		);
	}

	if (isBare && onVote) {
		return (
			<div
				className="inline-flex items-center gap-0 text-muted-foreground"
				role="group"
				aria-label="Vote"
			>
				<button
					type="button"
					disabled={pending}
					className={cn(bareBtn, upSelected && "text-primary")}
					aria-label="Upvote"
					aria-pressed={upSelected}
					onClick={() =>
						start(async () => {
							const res = await onVote(1);
							if (!res.success) toast.error(res.error || "Could not vote");
							else applyVoteResult(res);
						})
					}
				>
					<UpIcon size={iconSize} strokeWidth={2.25} aria-hidden />
				</button>
				<span
					className={cn(
						"min-w-[1.35rem] px-0.5 text-center text-xs font-medium tabular-nums",
						upSelected && "text-primary",
						downSelected && "text-destructive",
						!upSelected && !downSelected && "text-muted-foreground",
					)}
				>
					{localScore}
				</span>
				<button
					type="button"
					disabled={pending}
					className={cn(bareBtn, downSelected && "text-destructive")}
					aria-label="Downvote"
					aria-pressed={downSelected}
					onClick={() =>
						start(async () => {
							const res = await onVote(-1);
							if (!res.success) toast.error(res.error || "Could not vote");
							else applyVoteResult(res);
						})
					}
				>
					<DownIcon size={iconSize} strokeWidth={2.25} aria-hidden />
				</button>
			</div>
		);
	}

	if (isReddit) {
		return (
			<div className="flex flex-col items-center gap-0.5" aria-label="Vote">
				<button
					type="button"
					disabled={pending}
					onClick={() =>
						start(async () => {
							const res = await onVote(1);
							if (!res.success) toast.error(res.error || "Could not vote");
							else applyVoteResult(res);
						})
					}
					className={cn(
						btnReddit,
						upSelected && "text-primary bg-primary/15 hover:bg-primary/20",
					)}
					aria-label="Upvote"
					aria-pressed={upSelected}
				>
					<UpIcon size={iconSize} strokeWidth={2.25} aria-hidden />
				</button>
				<span
					className={cn(
						"min-h-5 min-w-7 px-0.5 text-center text-xs font-bold tabular-nums leading-none text-foreground/90",
						upSelected && "text-primary",
						downSelected && "text-destructive",
					)}
				>
					{localScore}
				</span>
				<button
					type="button"
					disabled={pending}
					onClick={() =>
						start(async () => {
							const res = await onVote(-1);
							if (!res.success) toast.error(res.error || "Could not vote");
							else applyVoteResult(res);
						})
					}
					className={cn(
						btnReddit,
						downSelected &&
							"text-destructive bg-destructive/10 hover:bg-destructive/15",
					)}
					aria-label="Downvote"
					aria-pressed={downSelected}
				>
					<DownIcon size={iconSize} strokeWidth={2.25} aria-hidden />
				</button>
			</div>
		);
	}

	return (
		<div className={cn("inline-flex items-center", isXs ? "gap-1" : "gap-1.5")}>
			<button
				type="button"
				disabled={pending}
				onClick={() =>
					start(async () => {
						const res = await onVote(1);
						if (!res.success) toast.error(res.error || "Could not vote");
						else applyVoteResult(res);
					})
				}
				className={cn(
					btnInline,
					upSelected && "bg-primary/10 text-primary border-primary/30",
				)}
				aria-label="Upvote"
			>
				<UpIcon size={iconSize} aria-hidden />
			</button>
			<span
				className={cn(
					"text-center font-semibold tabular-nums",
					isXs
						? "min-w-5 text-xs"
						: "min-w-8 text-sm",
				)}
			>
				{localScore}
			</span>
			<button
				type="button"
				disabled={pending}
				onClick={() =>
					start(async () => {
						const res = await onVote(-1);
						if (!res.success) toast.error(res.error || "Could not vote");
						else applyVoteResult(res);
					})
				}
				className={cn(
					btnInline,
					downSelected && "bg-primary/10 text-primary border-primary/30",
				)}
				aria-label="Downvote"
			>
				<DownIcon size={iconSize} aria-hidden />
			</button>
		</div>
	);
}

