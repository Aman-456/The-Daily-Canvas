"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mobile-collapsible filters container for `/search`.
 * - Mobile: collapsed by default, toggle button.
 * - Desktop (lg+): always open (no toggle).
 */
export function SearchFiltersShell({
	title = "Filters",
	children,
	defaultOpenMobile = false,
	className,
}: {
	title?: string;
	children: React.ReactNode;
	defaultOpenMobile?: boolean;
	className?: string;
}) {
	const regionId = useId();
	const [isDesktop, setIsDesktop] = useState<boolean>(false);
	const [openMobile, setOpenMobile] = useState(defaultOpenMobile);

	useEffect(() => {
		// Tailwind `lg` is 1024px by default.
		const mql = window.matchMedia("(min-width: 1024px)");
		const apply = () => setIsDesktop(mql.matches);
		apply();
		mql.addEventListener?.("change", apply);
		return () => mql.removeEventListener?.("change", apply);
	}, []);

	const open = isDesktop ? true : openMobile;

	return (
		<div className={cn("space-y-3", className)}>
			{isDesktop ? (
				<p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
					{title}
				</p>
			) : (
				<button
					type="button"
					aria-expanded={open}
					aria-controls={regionId}
					onClick={() => setOpenMobile((v) => !v)}
					className={cn(
						"flex w-full items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2 text-left text-sm font-semibold text-foreground shadow-sm outline-none transition-colors",
						"hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-primary/25",
					)}
				>
					<span>{title}</span>
					<ChevronDown
						className={cn(
							"size-4 shrink-0 text-muted-foreground opacity-80 transition-transform",
							open ? "rotate-180" : "rotate-0",
						)}
						aria-hidden
					/>
				</button>
			)}

			<div
				id={regionId}
				hidden={!open}
				className={cn(!open && "hidden")}
			>
				{children}
			</div>
		</div>
	);
}

