import { createClient, type RedisClientType } from "redis";

/**
 * Lazily-connected node-redis singleton.
 *
 * On serverless (Vercel) each warm instance reuses one TCP connection. If
 * `REDIS_URL` is unset or the connection fails, every getter returns `null` so
 * callers can fail open — Redis is used for rate limiting, not correctness, and
 * must never take the app down.
 */
let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType | null> | null = null;

export async function getRedis(): Promise<RedisClientType | null> {
	if (!process.env.REDIS_URL?.trim()) return null;
	if (client?.isReady) return client;
	if (connecting) return connecting;

	connecting = (async () => {
		try {
			const c: RedisClientType = createClient({ url: process.env.REDIS_URL });
			// Without a listener, a connection error throws unhandled and crashes the lambda.
			c.on("error", (err) => console.error("[redis] client error:", err));
			await c.connect();
			client = c;
			return client;
		} catch (err) {
			console.error("[redis] connect failed (failing open):", err);
			client = null;
			return null;
		} finally {
			connecting = null;
		}
	})();

	return connecting;
}
