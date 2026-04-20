"use client";

import { SessionProvider } from "next-auth/react";
import "fetch-coalescer/auto";

/**
 * Wraps the app with NextAuth's SessionProvider.
 *
 * Two things keep `/api/auth/session` traffic minimal:
 *
 *  1. `refetchOnWindowFocus={false}` and `refetchInterval={0}` — public
 *     SessionProvider props that stop NextAuth from refetching on every
 *     window focus and from polling every few minutes. This was the main
 *     source of redundant calls on production.
 *
 *  2. `fetch-coalescer/auto` — dedupes the well-known second
 *     `/api/auth/session` request that NextAuth v5 fires on mount due to its
 *     internal same-tab `BroadcastChannel` echo. The side-effect import
 *     installs a thin fetch-layer cache before any component mounts, with
 *     default options (1.5s TTL on `/api/auth/session`).
 *     See https://www.npmjs.com/package/fetch-coalescer
 *
 * Components that need a forced session refresh should call `update()` from
 * `useSession()` explicitly.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
			{children}
		</SessionProvider>
	);
}
