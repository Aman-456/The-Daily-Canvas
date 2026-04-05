/** Full message text including nested Error.cause (Neon/serverless often wraps PG errors). */
export function postgresErrorMessageChain(err: unknown): string {
	const parts: string[] = [];
	let e: unknown = err;
	let depth = 0;
	while (e != null && depth++ < 10) {
		if (e instanceof Error) {
			parts.push(e.message);
			e = e.cause;
		} else if (
			typeof e === "object" &&
			e &&
			"message" in e &&
			typeof (e as { message: unknown }).message === "string"
		) {
			parts.push((e as { message: string }).message);
			break;
		} else {
			parts.push(String(e));
			break;
		}
	}
	return parts.join(" | ");
}

function postgresErrorCode(err: unknown): string | undefined {
	let e: unknown = err;
	let depth = 0;
	while (e != null && depth++ < 10) {
		const code = (e as { code?: string }).code;
		if (typeof code === "string" && code.length > 0) {
			return code;
		}
		if (e instanceof Error) {
			e = e.cause;
		} else {
			break;
		}
	}
	return undefined;
}

/** Detect Postgres "relation does not exist" (e.g. migration not applied). */
export function isPostgresUndefinedTable(err: unknown): boolean {
	const code = postgresErrorCode(err);
	if (code === "42P01") return true;
	const msg = postgresErrorMessageChain(err);
	return /relation .+ does not exist/i.test(msg);
}

/**
 * `contact_submission.status` missing (migration 0004 / db:contact not applied).
 * Drizzle/Neon sometimes only surfaces a generic "Failed query: select ... status ...".
 */
export function isContactSubmissionStatusColumnMissing(err: unknown): boolean {
	const msg = postgresErrorMessageChain(err);
	const code = postgresErrorCode(err);
	if (code === "42703" && /status/i.test(msg) && /contact_submission/i.test(msg)) {
		return true;
	}
	if (
		/column .?"?status"? does not exist/i.test(msg) ||
		/undefined column/i.test(msg) && /status/i.test(msg)
	) {
		return true;
	}
	if (
		/Failed query:/i.test(msg) &&
		/"status"/.test(msg) &&
		/contact_submission/i.test(msg)
	) {
		return true;
	}
	return false;
}
