import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminToolbarCardProps = {
	/** Section label, e.g. "Search & filters" */
	title: string;
	children: ReactNode;
	className?: string;
};

/**
 * Groups search, filters, and secondary controls in one visual block.
 */
export function AdminToolbarCard({
	title,
	children,
	className,
}: AdminToolbarCardProps) {
	return (
		<div
			className={cn(
				"rounded-xl border border-border/60 bg-muted/30 p-4 shadow-sm dark:bg-zinc-900/40",
				className,
			)}
		>
			<div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				{title}
			</div>
			{children}
		</div>
	);
}
