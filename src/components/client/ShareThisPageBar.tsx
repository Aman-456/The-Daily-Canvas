"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Share2 } from "lucide-react";
import { SocialShareCompact } from "@/components/client/SocialShareCompact";
import { blogTagLabel, isBlogTagSlug } from "@/lib/blog-tags";

function shareTitleForPath(pathname: string): string {
	if (pathname === "/") return "Daily Thoughts — Home";
	if (pathname === "/archive") return "Daily Thoughts — Archive";
	if (pathname === "/about") return "Daily Thoughts — About";
	if (pathname === "/privacy-policy") return "Daily Thoughts — Privacy";
	if (pathname === "/terms-of-service") return "Daily Thoughts — Terms";

	const topicMatch = pathname.match(/^\/topics\/([^/]+)$/);
	if (topicMatch) {
		const slug = topicMatch[1];
		const label = isBlogTagSlug(slug) ? blogTagLabel(slug) : slug;
		return `Daily Thoughts — ${label}`;
	}

	if (pathname.startsWith("/blogs/")) return "Daily Thoughts — Article";

	return "Daily Thoughts";
}

/**
 * Top-of-site share strip (lives in the header). Resolves share copy from the route;
 * blog posts use `document.title` after navigation.
 */
export function HeaderShareStrip() {
	const pathname = usePathname() || "/";
	const sp = useSearchParams();
	const [articleHeadline, setArticleHeadline] = useState<string | null>(null);

	useEffect(() => {
		if (!pathname.startsWith("/blogs/")) {
			setArticleHeadline(null);
			return;
		}

		const readTitle = () => {
			const raw = document.title?.trim() ?? "";
			const head = raw
				.replace(/\s*[|–—]\s*Daily Thoughts.*$/i, "")
				.trim();
			setArticleHeadline(head || null);
		};

		readTitle();

		const titleNode = document.querySelector("title");
		if (!titleNode) return;

		const obs = new MutationObserver(readTitle);
		obs.observe(titleNode, {
			childList: true,
			characterData: true,
			subtree: true,
		});
		return () => obs.disconnect();
	}, [pathname]);

	const title = useMemo(() => {
		if (pathname.startsWith("/blogs/") && articleHeadline) {
			return `${articleHeadline} — Daily Thoughts`;
		}
		return shareTitleForPath(pathname);
	}, [pathname, articleHeadline]);

	const qs = sp.toString();
	const path = qs ? `${pathname}?${qs}` : pathname;

	return (
		<div className="border-b border-border/30 bg-muted/20 dark:bg-muted/10">
			<div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3 px-4 py-2 sm:px-8">
				<div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
					<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Share2 className="size-3.5" aria-hidden />
					</span>
					<div className="min-w-0">
						<p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
							Share
						</p>
						<p
							className="hidden truncate text-xs font-medium text-foreground/90 sm:block sm:text-[13px]"
							title={title}
						>
							{title}
						</p>
						<span className="sr-only sm:hidden">{title}</span>
					</div>
				</div>
				<SocialShareCompact url={path} title={title} variant="header" />
			</div>
		</div>
	);
}
