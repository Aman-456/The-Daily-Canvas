"use client";

import type { TocItem } from "@/lib/markdown-toc";

export function TableOfContents({
	items,
	variant = "inline",
}: {
	items: TocItem[];
	/** `sidebar`: narrow desktop rail. `inline`: mobile collapsible block. */
	variant?: "inline" | "sidebar";
}) {
	if (items.length === 0) return null;

	const goTo = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		e.stopPropagation();
		const el = document.getElementById(id);
		if (!el) return;
		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		el.scrollIntoView({
			behavior: reduceMotion ? "auto" : "smooth",
			block: "start",
		});
		history.replaceState(null, "", `#${id}`);
	};

	const isSidebar = variant === "sidebar";

	return (
		<nav
			aria-label="On this page"
			className={isSidebar ? "text-xs leading-snug" : "text-sm"}
		>
			<p
				className={
					isSidebar
						? "mb-2.5 text-[10px] font-bold uppercase leading-none tracking-[0.12em] text-muted-foreground"
						: "mb-2 font-semibold text-foreground"
				}
			>
				{isSidebar ? "Jump" : "On this page"}
			</p>
			<ul
				className={
					isSidebar
						? "flex flex-col gap-2.5 pl-0"
						: "space-y-2 border-l border-border/70 pl-3"
				}
			>
				{items.map((item) => (
					<li
						key={item.id}
						className={item.level === 3 ? (isSidebar ? "pl-2" : "ml-2") : ""}
					>
						<a
							href={`#${item.id}`}
							onClick={goTo(item.id)}
							title={item.text}
							className={
								isSidebar
									? "block break-words py-0.5 leading-relaxed text-muted-foreground transition-[color,transform] duration-200 ease-out hover:text-primary active:scale-[0.98] line-clamp-3 [overflow-wrap:anywhere]"
									: "text-muted-foreground transition-[color,transform] duration-200 ease-out hover:text-primary active:scale-[0.98] line-clamp-2"
							}
						>
							{item.text}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}
