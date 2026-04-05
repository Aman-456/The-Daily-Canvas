"use server";

import { db } from "@/db/index";
import { contactSubmissions } from "@/db/schema";
import {
	desc,
	ilike,
	or,
	sql,
	and,
	eq,
	ne,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { contactFormSchema } from "@/lib/validations/contact";
import {
	getAnyAdminUserId,
	insertAdminOnlyNotification,
} from "@/lib/notify-admins";
import { checkPermission, PERMISSIONS } from "@/lib/permissions";
import {
	isPostgresUndefinedTable,
	isContactSubmissionStatusColumnMissing,
	postgresErrorMessageChain,
} from "@/lib/pg-errors";
import { auth } from "@/auth";
import {
	type ContactSubmissionStatus,
	type ContactSubmissionStatusFilter,
	isContactSubmissionStatus,
} from "@/lib/contact-submission-status";
import { revalidatePath } from "next/cache";

export type ContactFormState = {
	success: boolean;
	error: string | null;
};

function formString(fd: FormData, key: string): string {
	const v = fd.get(key);
	return typeof v === "string" ? v : "";
}

export async function submitContactMessage(
	_prev: ContactFormState,
	formData: FormData,
): Promise<ContactFormState> {
	const session = await auth();

	let name = formString(formData, "name");
	let email = formString(formData, "email");
	const message = formString(formData, "message");

	if (session?.user?.email) {
		const sessionEmail = session.user.email.trim().toLowerCase();
		email = sessionEmail;
		const sessionName = session.user.name?.trim();
		name =
			sessionName && sessionName.length > 0
				? sessionName
				: name.trim() || sessionEmail.split("@")[0] || "Reader";
	}

	name = name.slice(0, 120);

	const parsed = contactFormSchema.safeParse({
		name,
		email,
		message,
	});

	if (!parsed.success) {
		const first = parsed.error.issues[0];
		return { success: false, error: first?.message ?? "Invalid input" };
	}

	const normalizedEmail = parsed.data.email.trim().toLowerCase();

	try {
		await db.insert(contactSubmissions).values({
			name: parsed.data.name.trim(),
			email: normalizedEmail,
			message: parsed.data.message.trim(),
			status: "new",
		});
	} catch (err) {
		console.error("[submitContactMessage]", err);
		if (isPostgresUndefinedTable(err)) {
			return {
				success: false,
				error:
					"Contact form is not available yet. Please try again later or email us directly.",
			};
		}
		if (isContactSubmissionStatusColumnMissing(err)) {
			return {
				success: false,
				error:
					"Contact form is temporarily unavailable (database update pending). Please try again later.",
			};
		}
		return {
			success: false,
			error: "Could not send your message. Please try again.",
		};
	}

	try {
		const adminId = await getAnyAdminUserId();
		if (adminId) {
			const preview =
				parsed.data.message.trim().slice(0, 80) +
				(parsed.data.message.trim().length > 80 ? "…" : "");
			await insertAdminOnlyNotification({
				type: "CONTACT_FORM",
				message: `Contact: ${parsed.data.name.trim()} (${normalizedEmail}) — ${preview}`,
				link: "/admin/contact",
				blogLink: "/admin/contact",
				userIdForFk: adminId,
			});
		}
	} catch (notifErr) {
		console.error("[submitContactMessage] admin notification:", notifErr);
	}

	return { success: true, error: null };
}

export async function updateContactSubmissionStatus(
	id: string,
	status: ContactSubmissionStatus,
) {
	const { authorized } = await checkPermission(PERMISSIONS.MANAGE_PAGES);
	if (!authorized) {
		return { success: false as const, error: "Unauthorized" };
	}
	if (!isContactSubmissionStatus(status)) {
		return { success: false as const, error: "Invalid status" };
	}

	try {
		const updated = await db
			.update(contactSubmissions)
			.set({ status })
			.where(eq(contactSubmissions.id, id))
			.returning({ id: contactSubmissions.id });
		if (updated.length === 0) {
			return { success: false as const, error: "Message not found" };
		}
		revalidatePath("/admin/contact");
		return { success: true as const };
	} catch (err) {
		console.error("[updateContactSubmissionStatus]", err);
		if (isContactSubmissionStatusColumnMissing(err)) {
			return {
				success: false as const,
				error:
					'Status column missing. Run `npm run db:contact` or apply migration 0004 on this database.',
			};
		}
		return {
			success: false as const,
			error: "Could not update status.",
		};
	}
}

export async function getAdminContactSubmissions(options?: {
	search?: string;
	skip?: number;
	limit?: number;
	statusFilter?: ContactSubmissionStatusFilter;
}) {
	const { authorized } = await checkPermission(PERMISSIONS.MANAGE_PAGES);
	if (!authorized) {
		return { success: false as const, error: "Unauthorized", total: 0 };
	}

	const search = (options?.search ?? "").trim();
	const skip = Math.max(0, options?.skip ?? 0);
	const limit = Math.min(100, Math.max(1, options?.limit ?? 30));
	const statusFilter = options?.statusFilter ?? "all";

	try {
		let listQuery = db.select().from(contactSubmissions);
		let countQuery = db
			.select({ count: sql<number>`count(*)::int` })
			.from(contactSubmissions);

		const conditions: SQL[] = [];

		if (search.length > 0) {
			const pattern = `%${search}%`;
			const textMatch = or(
				ilike(contactSubmissions.name, pattern),
				ilike(contactSubmissions.email, pattern),
				ilike(contactSubmissions.message, pattern),
			);
			if (textMatch) conditions.push(textMatch);
		}

		if (statusFilter === "not_new") {
			conditions.push(ne(contactSubmissions.status, "new"));
		} else if (statusFilter !== "all") {
			conditions.push(eq(contactSubmissions.status, statusFilter));
		}

		if (conditions.length > 0) {
			const combined =
				conditions.length === 1 ? conditions[0] : and(...conditions);
			if (combined) {
				listQuery = listQuery.where(combined) as typeof listQuery;
				countQuery = countQuery.where(combined) as typeof countQuery;
			}
		}

		const [rows, countRows] = await Promise.all([
			listQuery
				.orderBy(desc(contactSubmissions.createdAt))
				.limit(limit)
				.offset(skip),
			countQuery,
		]);

		const total = Number(countRows[0]?.count ?? 0);
		return { success: true as const, data: rows, total };
	} catch (err) {
		console.error("[getAdminContactSubmissions]", err);
		if (isPostgresUndefinedTable(err)) {
			return {
				success: false as const,
				error:
					'The "contact_submission" table is missing. Run `npm run db:migrate` or `npm run db:contact` against your database, then reload this page.',
				total: 0,
			};
		}
		if (isContactSubmissionStatusColumnMissing(err)) {
			return {
				success: false as const,
				error:
					'The contact "status" column is missing on this database. Run `npm run db:migrate` or `npm run db:contact` against the same DATABASE_URL as production, then reload.',
				total: 0,
			};
		}
		const detail =
			process.env.NODE_ENV === "development"
				? postgresErrorMessageChain(err)
				: null;
		return {
			success: false as const,
			error: detail
				? `Could not load messages: ${detail}`
				: "Could not load messages. Check server logs.",
			total: 0,
		};
	}
}
