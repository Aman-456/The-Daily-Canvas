"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, Home, Info, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
	href: string;
	label: string;
	icon: typeof Home;
	isActive: (pathname: string) => boolean;
};

const items: NavItem[] = [
	{
		href: "/",
		label: "Home",
		icon: Home,
		isActive: (p) => p === "/",
	},
	{
		href: "/archive",
		label: "Archive",
		icon: Archive,
		isActive: (p) => p === "/archive" || p.startsWith("/archive/"),
	},
	{
		href: "/search",
		label: "Search",
		icon: Search,
		isActive: (p) => p === "/search",
	},
	{
		href: "/about",
		label: "About",
		icon: Info,
		isActive: (p) => p === "/about",
	},
];

/**
 * Primary links that sit in the header from `md` up; duplicated here for thumb reach on small screens.
 */
export function MobileBottomNav() {
	const pathname = usePathname();

	return (
		<nav
			className="fixed bottom-0 left-0 right-0 z-[60] border-t border-border/50 bg-background/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md dark:shadow-[0_-4px_24px_rgba(0,0,0,0.25)] md:hidden"
			aria-label="Mobile navigation"
		>
			<div className="mx-auto flex max-w-screen-2xl items-stretch justify-between gap-1 px-1">
				{items.map(({ href, label, icon: Icon, isActive }) => {
					const active = isActive(pathname);
					return (
						<Link
							key={href}
							href={href}
							className={cn(
								"flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[0.58rem] font-bold uppercase tracking-[0.08em] transition-colors",
								active
									? "text-primary"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<Icon
								className="size-4 shrink-0"
								strokeWidth={active ? 2.25 : 1.75}
								aria-hidden
							/>
							<span className="truncate">{label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
