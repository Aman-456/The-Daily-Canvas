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
	parseContactSubmissionStatusFilter,
} from "@/lib/contact-submission-status";
import type { ContactSubmissionStatus } from "@/lib/contact-submission-status";
import { AdminListPageShell } from "@/components/admin/AdminListPageShell";
import { AdminToolbarCountLabeled } from "@/components/admin/AdminToolbarCount";
import { AdminFilters } from "@/components/admin/AdminFilters";

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
		<AdminListPageShell
			title="Contact messages"
			description={
				<>
					Submissions from the public{" "}
					<Link
						href="/contact"
						className="text-primary hover:underline"
						target="_blank"
					>
						contact form
					</Link>
					. Triage with status (new → read → contacted → resolved). Long messages open in a
					dialog.
				</>
			}
			toolbarTitle="Filter & search"
			toolbar={
				result.success ? (
					<div className="flex w-full min-w-0 flex-col gap-4">
						<div className="w-full min-w-0">
							<AdminSearch
								placeholder="Search name, email, or message…"
								className="max-w-none shadow-none"
							/>
						</div>
						<div className="flex min-w-0 w-full flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
							<div className="min-w-0 lg:flex-1">
								<AdminFilters
									className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-3"
									filters={[
										{
											key: "status",
											label: "Status",
											defaultValue: "all",
											options: CONTACT_SUBMISSION_STATUS_FILTER_OPTIONS.map(
												({ value, label }) => ({ value, label }),
											),
										},
									]}
								/>
							</div>
							<div className="w-full shrink-0 lg:w-auto">
								<AdminToolbarCountLabeled
									label={
										search.trim() || statusFilter !== "all"
											? "Matching messages"
											: "Total messages"
									}
									value={total}
								/>
							</div>
						</div>
					</div>
				) : undefined
			}
		>
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
		</AdminListPageShell>
	);
}
