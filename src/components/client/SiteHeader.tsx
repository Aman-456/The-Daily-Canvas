"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/client/UserNav";
import { ThemeToggle } from "@/components/client/ThemeToggle";
import SearchInput from "@/components/client/SearchInput";
import { HeaderShareStrip } from "@/components/client/ShareThisPageBar";
import { signIn } from "next-auth/react";

function navLinkClass(active: boolean) {
	return active
		? "text-primary border-b-2 border-primary pb-1 font-bold text-sm tracking-tight"
		: "text-muted-foreground hover:text-foreground transition-colors font-bold text-sm tracking-tight";
}

export function SiteHeader({ session }: { session: Session | null }) {
	const pathname = usePathname();
	const sp = useSearchParams();
	const search = sp.get("search") ?? "";
	const homeActive = pathname === "/";
	const archiveActive = pathname === "/archive";
	const aboutActive = pathname === "/about";

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 shadow-[0_8px_24px_rgba(0,0,0,0.04)] backdrop-blur-md dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
			<HeaderShareStrip />
			<div className="mx-auto flex h-20 max-w-screen-2xl items-center justify-between gap-4 bg-background/85 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sm:px-8">
				<div className="flex min-w-0 items-center gap-8 lg:gap-10">
					<Link
						href="/"
						className="font-headline text-xl font-extrabold tracking-tighter text-foreground shrink-0"
					>
						Daily <span className="text-primary">Thoughts</span>
					</Link>
					<nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
						<Link href="/" className={navLinkClass(homeActive)}>
							Home
						</Link>
						<Link href="/archive" className={navLinkClass(archiveActive)}>
							Archive
						</Link>
						<Link href="/about" className={navLinkClass(aboutActive)}>
							About
						</Link>
					</nav>
				</div>

				<div className="flex items-center gap-3 sm:gap-5">
					<div className="relative hidden lg:block w-56 xl:w-64">
						<SearchInput defaultValue={search} key={search} variant="editorial" />
					</div>
					<Link href="/#newsletter" className="hidden sm:inline-flex">
						<Button
							size="sm"
							className="rounded-xl px-5 font-headline font-bold shadow-none"
						>
							Subscribe
						</Button>
					</Link>
					<ThemeToggle />
					{session?.user ? (
						<UserNav user={session.user} />
					) : (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="hidden sm:inline-flex font-medium"
							onClick={() => signIn("google")}
						>
							Sign in
						</Button>
					)}
				</div>
			</div>
			<div className="border-t border-border/30 px-4 pb-3 pt-2 lg:hidden">
				<SearchInput defaultValue={search} key={`m-${search}`} variant="editorial" />
			</div>
		</header>
	);
}
