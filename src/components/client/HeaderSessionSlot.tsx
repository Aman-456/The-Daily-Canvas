"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/client/UserNav";

function AvatarSkeleton() {
	return (
		<div
			aria-label="Loading account"
			className="h-10 w-10 rounded-full bg-muted/70 ring-1 ring-border/60 animate-pulse"
		/>
	);
}

/**
 * Client-only header slot that shows:
 * - skeleton while session is loading
 * - UserNav when authenticated
 * - Sign in link when not authenticated
 */
export function HeaderSessionSlot() {
	const { data: session, status } = useSession();
	const pathname = usePathname();
	const sp = useSearchParams();

	const signInCallbackUrl = useMemo(() => {
		const qs = sp.toString();
		return qs ? `${pathname}?${qs}` : pathname;
	}, [pathname, sp]);
	const signInHref = `/signin?callbackUrl=${encodeURIComponent(signInCallbackUrl)}`;

	if (status === "loading") {
		return <AvatarSkeleton />;
	}

	if (session?.user) {
		return <UserNav user={session.user} />;
	}

	return (
		<Button variant="ghost" size="sm" className="font-medium" asChild>
			<Link href={signInHref}>Sign in</Link>
		</Button>
	);
}

