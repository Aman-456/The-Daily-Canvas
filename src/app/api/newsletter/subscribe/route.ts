import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import {
	getAnyAdminUserId,
	insertAdminOnlyNotification,
} from "@/lib/notify-admins";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPostgresUniqueViolation(err: unknown): boolean {
	const e = err as { code?: string; cause?: { code?: string } };
	return e?.code === "23505" || e?.cause?.code === "23505";
}

function isUndefinedTable(err: unknown): boolean {
	const e = err as { code?: string; cause?: { code?: string }; message?: string };
	const code = e?.code ?? e?.cause?.code;
	if (code === "42P01") return true;
	const msg = String(e?.message ?? e?.cause ?? "");
	return /relation .+ does not exist/i.test(msg);
}

export async function POST(req: Request) {
	try {
		if (!process.env.DATABASE_URL?.trim()) {
			return NextResponse.json(
				{ error: "Database is not configured (DATABASE_URL)." },
				{ status: 503 },
			);
		}

		let body: unknown;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
		}

		const raw =
			typeof body === "object" &&
			body !== null &&
			"email" in body &&
			typeof (body as { email: unknown }).email === "string"
				? (body as { email: string }).email
				: "";

		const email = raw.trim().toLowerCase();

		if (!email || !EMAIL_RE.test(email)) {
			return NextResponse.json({ error: "Invalid email" }, { status: 400 });
		}

		const existing = await db.query.newsletterSubscribers.findFirst({
			where: eq(newsletterSubscribers.email, email),
		});

		if (existing) {
			return NextResponse.json({ ok: true, alreadySubscribed: true });
		}

		try {
			await db.insert(newsletterSubscribers).values({ email });
		} catch (insertErr) {
			if (isPostgresUniqueViolation(insertErr)) {
				return NextResponse.json({ ok: true, alreadySubscribed: true });
			}
			throw insertErr;
		}

		revalidateTag("newsletter-subscribers", "max");

		try {
			const adminId = await getAnyAdminUserId();
			if (adminId) {
				await insertAdminOnlyNotification({
					type: "NEWSLETTER_SUBSCRIBE",
					message: `Newsletter signup: ${email}`,
					link: "/admin/newsletter",
					blogLink: "/admin/newsletter",
					userIdForFk: adminId,
				});
			}
		} catch (notifErr) {
			console.error("[newsletter/subscribe] admin notification:", notifErr);
		}

		return NextResponse.json({ ok: true, alreadySubscribed: false });
	} catch (err) {
		console.error("[newsletter/subscribe]", err);

		if (isUndefinedTable(err)) {
			return NextResponse.json(
				{
					error:
						"Newsletter storage is not set up yet. Apply the database migration (newsletter_subscriber table).",
				},
				{ status: 503 },
			);
		}

		const message =
			process.env.NODE_ENV === "development" && err instanceof Error
				? err.message
				: "Could not save your email. Please try again.";

		return NextResponse.json({ error: message }, { status: 500 });
	}
}
