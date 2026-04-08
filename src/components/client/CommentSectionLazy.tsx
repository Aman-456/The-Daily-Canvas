"use client";

import dynamic from "next/dynamic";

const CommentSection = dynamic(
	() =>
		import("@/components/client/CommentSection").then((m) => m.CommentSection),
	{
		ssr: false,
		loading: () => (
			<div className="mt-12 max-w-3xl mx-auto rounded-2xl border border-border/50 bg-muted/20 p-6">
				<div className="h-5 w-40 animate-pulse rounded bg-muted/70" />
				<div className="mt-4 h-24 w-full animate-pulse rounded bg-muted/70" />
			</div>
		),
	},
);

export default CommentSection;

