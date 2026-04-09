import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminToolbarCountProps = {
	/** Shown slightly stronger, e.g. the number */
	count: ReactNode;
	/** Lowercase-ish unit after the count, e.g. "posts", "users" */
	unit: string;
	className?: string;
};

/**
 * Compact count for toolbar rows — muted text, not a full-width tinted badge.
 */
export function AdminToolbarCount({ count, unit, className }: AdminToolbarCountProps) {
	return (
		<p
			className={cn(
				"shrink-0 text-xs tabular-nums text-muted-foreground",
				className,
			)}
		>
			<span className="font-medium text-foreground/80">{count}</span> {unit}
		</p>
	);
}

type AdminToolbarCountLabeledProps = {
	label: string;
	value: ReactNode;
	className?: string;
};

/** “Label: value” on one line, same visual weight as {@link AdminToolbarCount}. */
export function AdminToolbarCountLabeled({
	label,
	value,
	className,
}: AdminToolbarCountLabeledProps) {
	return (
		<p
			className={cn(
				"shrink-0 text-xs tabular-nums text-muted-foreground",
				className,
			)}
		>
			<span className="font-medium text-foreground/80">{label}</span>
			<span className="text-muted-foreground">: </span>
			<span className="font-medium text-foreground/80">{value}</span>
		</p>
	);
}
