export type SubscribeNewsletterResult =
	| { ok: true; alreadySubscribed: boolean }
	| { ok: false; error: string };

export async function subscribeNewsletter(
	email: string,
): Promise<SubscribeNewsletterResult> {
	const res = await fetch("/api/newsletter/subscribe", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email }),
	});

	const rawText = await res.text();
	let data: { ok?: boolean; alreadySubscribed?: boolean; error?: string } = {};
	try {
		data = JSON.parse(rawText) as typeof data;
	} catch {
		/* non-JSON (e.g. HTML error page) */
	}

	if (!res.ok) {
		const fallback =
			rawText.length > 0 && rawText.length < 200 && !data.error
				? rawText
				: null;
		return {
			ok: false,
			error:
				typeof data.error === "string"
					? data.error
					: fallback ?? `Request failed (${res.status}).`,
		};
	}

	return {
		ok: true,
		alreadySubscribed: Boolean(data.alreadySubscribed),
	};
}
