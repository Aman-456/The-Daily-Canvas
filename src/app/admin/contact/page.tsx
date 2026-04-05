import Link from "next/link";
import { redirect } from "next/navigation";
import { checkPermission, PERMISSIONS } from "@/lib/permissions";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { getAdminContactSubmissions } from "@/actions/contact";
import { ContactSubmissionsTable } from "@/components/admin/ContactSubmissionsTable";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { AdminPagination } from "@/components/admin/AdminPagination";
import type { ContactSubmission } from "@/db/schema";
import {
	CONTACT_SUBMISSION_STATUS_FILTER_OPTIONS,
	adminContactListHref,
	parseContactSubmissionStatusFilter,
} from "@/lib/contact-submission-status";
import type { ContactSubmissionStatus } from "@/lib/contact-submission-status";
import { cn } from "@/lib/utils";

function toRow(r: ContactSubmission) {
	const status = (r.status ?? "new") as ContactSubmissionStatus;
	return {
		id: r.id,
		name: r.name,
		email: r.email,
		message: r.message,
		status,
		createdAt: r.createdAt.toISOString(),
	};
}

export default async function AdminContactPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { authorized } = await checkPermission(PERMISSIONS.MANAGE_PAGES);

	if (!authorized) {
		return <AccessDenied requiredPermission="canManagePages" />;
	}

	const params = await searchParams;
	const pageStr =
		typeof params.page === "string"
			? params.page
			: Array.isArray(params.page)
				? params.page[0]
				: undefined;
	const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
	const searchRaw = params.search;
	const search =
		typeof searchRaw === "string"
			? searchRaw
			: Array.isArray(searchRaw)
				? searchRaw[0]
				: "";
	const statusRaw = params.status;
	const statusParam =
		typeof statusRaw === "string"
			? statusRaw
			: Array.isArray(statusRaw)
				? statusRaw[0]
				: undefined;
	const statusFilter = parseContactSubmissionStatusFilter(statusParam);

	const limit = 30;
	const skip = (page - 1) * limit;

	const result = await getAdminContactSubmissions({
		search,
		skip,
		limit,
		statusFilter,
	});
	const rows: ContactSubmission[] =
		result.success && result.data ? result.data : [];
	const total = result.success ? result.total : 0;
	const totalPages = Math.max(1, Math.ceil(total / limit));

	if (result.success && page > totalPages) {
		const p = new URLSearchParams();
		if (search.trim()) p.set("search", search.trim());
		if (statusFilter !== "all") p.set("status", statusFilter);
		p.set("page", String(totalPages));
		redirect(`/admin/contact?${p.toString()}`);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Contact messages</h1>
					<p className="text-muted-foreground">
						Submissions from the public{" "}
						<Link href="/contact" className="text-primary hover:underline" target="_blank">
							contact form
						</Link>
						. Set status as you triage (new → read → contacted → resolved). Filter by status
						below; long messages open in a dialog.
					</p>
				</div>
				{result.success ? (
					<div className="rounded-lg border border-primary/10 bg-primary/5 px-4 py-2">
						<p className="text-sm font-medium text-primary">
							{search.trim() || statusFilter !== "all"
								? "Matching messages"
								: "Total messages"}
							: {total}
						</p>
					</div>
				) : null}
			</div>

			{result.success ? (
				<>
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
							Status
						</span>
						{CONTACT_SUBMISSION_STATUS_FILTER_OPTIONS.map(({ value, label }) => (
							<Link
								key={value}
								href={adminContactListHref({
									search,
									status: value,
									page: 1,
								})}
								className={cn(
									"rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
									statusFilter === value
										? "border-primary bg-primary text-primary-foreground"
										: "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
								)}
							>
								{label}
							</Link>
						))}
					</div>
					<div className="flex items-center justify-between gap-4">
						<AdminSearch placeholder="Search name, email, or message…" />
					</div>
				</>
			) : null}

			{!result.success ? (
				<div
					className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
					role="alert"
				>
					<p className="font-medium">Couldn&apos;t load messages</p>
					<p className="mt-2 text-foreground/90">{result.error}</p>
				</div>
			) : (
				<>
					<ContactSubmissionsTable rows={rows.map(toRow)} />
					<AdminPagination totalPages={totalPages} currentPage={page} />
				</>
			)}
		</div>
	);
}
