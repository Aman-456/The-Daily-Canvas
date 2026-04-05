export const CONTACT_SUBMISSION_STATUSES = [
	"new",
	"read",
	"contacted",
	"resolved",
] as const;

export type ContactSubmissionStatus =
	(typeof CONTACT_SUBMISSION_STATUSES)[number];

export const CONTACT_SUBMISSION_STATUS_LABELS: Record<
	ContactSubmissionStatus,
	string
> = {
	new: "New",
	read: "Read",
	contacted: "Contacted",
	resolved: "Resolved",
};

export type ContactSubmissionStatusFilter =
	| "all"
	| "not_new"
	| ContactSubmissionStatus;

export const CONTACT_SUBMISSION_STATUS_FILTER_OPTIONS: {
	value: ContactSubmissionStatusFilter;
	label: string;
}[] = [
	{ value: "all", label: "All" },
	{ value: "new", label: "New (unread)" },
	{ value: "not_new", label: "Not new" },
	{ value: "read", label: "Read" },
	{ value: "contacted", label: "Contacted" },
	{ value: "resolved", label: "Resolved" },
];

export function isContactSubmissionStatus(
	s: string,
): s is ContactSubmissionStatus {
	return (CONTACT_SUBMISSION_STATUSES as readonly string[]).includes(s);
}

export function parseContactSubmissionStatusFilter(
	raw: string | undefined,
): ContactSubmissionStatusFilter {
	if (!raw || raw === "all") return "all";
	if (raw === "not_new") return "not_new";
	if (isContactSubmissionStatus(raw)) return raw;
	return "all";
}

export function adminContactListHref(opts: {
	search: string;
	status: ContactSubmissionStatusFilter;
	page?: number;
}): string {
	const p = new URLSearchParams();
	if (opts.search.trim()) p.set("search", opts.search.trim());
	if (opts.status !== "all") p.set("status", opts.status);
	if (opts.page && opts.page > 1) p.set("page", String(opts.page));
	const q = p.toString();
	return q ? `/admin/contact?${q}` : "/admin/contact";
}

export function statusBadgeClass(status: ContactSubmissionStatus): string {
	switch (status) {
		case "new":
			return "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100";
		case "read":
			return "border-blue-500/40 bg-blue-500/10 text-blue-900 dark:text-blue-100";
		case "contacted":
			return "border-violet-500/40 bg-violet-500/10 text-violet-900 dark:text-violet-100";
		case "resolved":
			return "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100";
		default:
			return "";
	}
}
