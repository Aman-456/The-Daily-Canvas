import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminPageHeaderProps = {
	title: string;
	description?: ReactNode;
	/** e.g. total badge, stats pill */
	aside?: ReactNode;
	/** e.g. primary CTA button(s) */
	actions?: ReactNode;
	className?: string;
};

/**
 * Consistent page title block for admin list/detail pages (mobile-first).
 */
export function AdminPageHeader({
	title,
	description,
	aside,
	actions,
	className,
}: AdminPageHeaderProps) {
	const hasTrailing = Boolean(aside || actions);

	return (
		<div
			className={cn(
				"flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
				className,
			)}
		>
			<div className="min-w-0 space-y-1">
				<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
				{description ? (
					<div className="text-sm text-muted-foreground sm:text-base">
						{description}
					</div>
				) : null}
			</div>
			{hasTrailing ? (
				<div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 sm:pt-1">
					{aside}
					{actions}
				</div>
			) : null}
		</div>
	);
}
