"use client";

import { Button } from "@/components/ui/button";

type Props = {
	count: number;
	onJumpToComposer: () => void;
};

export function CommentThreadHeader({ count, onJumpToComposer }: Props) {
	const label = count === 1 ? "comment" : "comments";

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
			<h3 className="text-lg font-bold tracking-tight md:text-xl">
				{count}{" "}
				<span className="font-semibold text-muted-foreground">{label}</span>
			</h3>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="h-8 rounded-full px-3 text-xs font-semibold"
				onClick={onJumpToComposer}
			>
				Jump to comment box
			</Button>
		</div>
	);
}
