import { headers } from "next/headers";
import { getRedis } from "@/lib/redis";

export type RateLimitResult = {
	/** Whether the request is allowed (under the limit). */
	success: boolean;
	/** Requests remaining in the current window. */
	remaining: number;
	limit: number;
	/** Seconds until the window resets. */
	reset: number;
};

/**
 * Best-effort client IP from proxy headers. Works in both Route Handlers and
 * Server Actions via `next/headers`. Returns "unknown" when no header is set
 * (e.g. local dev) — all such callers share one bucket, which is acceptable.
 */
export async function getClientIp(): Promise<string> {
	const h = await headers();
	const fwd = h.get("x-forwarded-for");
	if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
	return h.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Fixed-window limiter backed by Redis `INCR` + `EXPIRE`.
 *
 * Fails OPEN: if Redis is unconfigured or unreachable the request is allowed,
 * so rate limiting can never take the app down.
 */
export async function rateLimit(
	key: string,
	limit: number,
	windowSeconds: number,
): Promise<RateLimitResult> {
	const redis = await getRedis();
	if (!redis) {
		return { success: true, remaining: limit, limit, reset: 0 };
	}

	const redisKey = `rl:${key}`;
	try {
		const count = await redis.incr(redisKey);
		if (count === 1) {
			await redis.expire(redisKey, windowSeconds);
		}
		const ttl = await redis.ttl(redisKey);
		return {
			success: count <= limit,
			remaining: Math.max(0, limit - count),
			limit,
			reset: ttl >= 0 ? ttl : windowSeconds,
		};
	} catch (err) {
		console.error("[rate-limit] redis error (failing open):", err);
		return { success: true, remaining: limit, limit, reset: 0 };
	}
}

/**
 * Returns true the first time `key` is seen within `windowSeconds`, false on
 * repeats. Used for view-count de-duplication so a refresh/bot doesn't inflate
 * counts. Fails OPEN (returns true) when Redis is unavailable.
 */
export async function firstSeenInWindow(
	key: string,
	windowSeconds: number,
): Promise<boolean> {
	const redis = await getRedis();
	if (!redis) return true;

	try {
		const stored = await redis.set(`seen:${key}`, "1", {
			NX: true,
			EX: windowSeconds,
		});
		return stored === "OK";
	} catch (err) {
		console.error("[rate-limit] firstSeen redis error (failing open):", err);
		return true;
	}
}
