"use client";

export function CommentThreadSkeleton() {
	return (
		<div className="space-y-4 pt-2" aria-busy aria-label="Loading comments">
			{[0, 1, 2].map((i) => (
				<div
					key={i}
					className="flex gap-3 rounded-lg border border-border/40 bg-muted/10 p-4"
				>
					<div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
					<div className="min-w-0 flex-1 space-y-2">
						<div className="h-3 w-28 animate-pulse rounded bg-muted" />
						<div className="h-3 w-full max-w-md animate-pulse rounded bg-muted" />
						<div className="h-3 w-3/4 max-w-sm animate-pulse rounded bg-muted" />
					</div>
				</div>
			))}
		</div>
	);
}
