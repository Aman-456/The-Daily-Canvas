"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
	THREAD_BORDER_CLASS,
	THREAD_LINE_CLASS,
	THREAD_STEP_PX,
	THREAD_TOGGLE_PX,
} from "@/components/client/comments/comment-thread-tokens";

export {
	THREAD_LINE_CLASS,
	THREAD_STEP_PX,
	THREAD_TOGGLE_PX,
} from "@/components/client/comments/comment-thread-tokens";

/** Vertical spine: absolute on the CommentItem, from below the toggle to bottom. */
export function ThreadSpine() {
	return (
		<span
			aria-hidden
			className={cn("pointer-events-none absolute bottom-0 w-px", THREAD_LINE_CLASS)}
			style={{
				left: THREAD_STEP_PX / 2 - 0.5,
				top: THREAD_TOGGLE_PX + 2,
			}}
		/>
	);
}

/** Horizontal connector from parent spine center to this item's content start. */
export function ThreadConnector() {
	return (
		<span
			aria-hidden
			className={cn("pointer-events-none absolute h-px", THREAD_LINE_CLASS)}
			style={{
				left: -(THREAD_STEP_PX / 2),
				top: 20,
				width: THREAD_STEP_PX + THREAD_STEP_PX / 2,
			}}
		/>
	);
}

type CollapseToggleProps = {
	isCollapsed: boolean;
	isLoadingReplies: boolean;
	onToggle: () => void;
	collapseLabel: string;
	visibleReplyCount: number;
	toggleIcon: ReactNode;
};

export function ThreadCollapseToggle({
	isCollapsed,
	isLoadingReplies,
	onToggle,
	collapseLabel,
	visibleReplyCount,
	toggleIcon,
}: CollapseToggleProps) {
	return (
		<button
			type="button"
			onClick={() => void onToggle()}
			disabled={isLoadingReplies}
			className={cn(
				"absolute z-10 flex shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-60",
				THREAD_BORDER_CLASS,
			)}
			style={{
				width: THREAD_TOGGLE_PX,
				height: THREAD_TOGGLE_PX,
				left: THREAD_STEP_PX / 2 - THREAD_TOGGLE_PX / 2,
				top: 2,
			}}
			aria-expanded={!isCollapsed}
			aria-label={collapseLabel}
			title={`${visibleReplyCount} ${visibleReplyCount === 1 ? "reply" : "replies"}`}
		>
			{toggleIcon}
		</button>
	);
}

export function ThreadRepliesList({
	className,
	children,
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<div className={cn("relative space-y-2.5", className)}>{children}</div>
	);
}
