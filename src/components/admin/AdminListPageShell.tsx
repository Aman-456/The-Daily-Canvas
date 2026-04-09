import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbarCountLabeled } from "@/components/admin/AdminToolbarCount";
import { AdminToolbarCard } from "@/components/admin/AdminToolbarCard";

export type AdminListPageShellProps = {
	title: string;
	description?: ReactNode;
	/** Prefer showing counts inside `toolbar` instead; kept for rare header-only badges */
	totalBadge?: { label: string; value: ReactNode };
	/** Full control of the header trailing area (overrides `totalBadge`) */
	aside?: ReactNode;
	actions?: ReactNode;
	/** Label above the toolbar card; default “Search & filters” */
	toolbarTitle?: string;
	/** When set, wrapped in `AdminToolbarCard`. Omit to hide the toolbar block */
	toolbar?: ReactNode;
	headerClassName?: string;
	className?: string;
	children?: ReactNode;
};

/**
 * Standard admin list page layout: title + description, optional total badge, optional filter/search toolbar, then main content.
 */
export function AdminListPageShell({
	title,
	description,
	totalBadge,
	aside,
	actions,
	toolbarTitle = "Search & filters",
	toolbar,
	headerClassName,
	className,
	children,
}: AdminListPageShellProps) {
	const headerAside =
		aside !== undefined
			? aside
			: totalBadge
				? (
					<AdminToolbarCountLabeled
						label={totalBadge.label}
						value={totalBadge.value}
					/>
				)
				: undefined;

	const showToolbar = toolbar != null;

	return (
		<div className={cn("space-y-6", className)}>
			<AdminPageHeader
				title={title}
				description={description}
				aside={headerAside}
				actions={actions}
				className={headerClassName}
			/>
			{showToolbar ? <AdminToolbarCard title={toolbarTitle}>{toolbar}</AdminToolbarCard> : null}
			{children}
		</div>
	);
}
