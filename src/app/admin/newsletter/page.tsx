import { checkPermission, PERMISSIONS } from "@/lib/permissions";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { getCachedNewsletterSubscribers } from "@/actions/newsletter";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { NewsletterSubscriber } from "@/db/schema";
import { AdminListPageShell } from "@/components/admin/AdminListPageShell";
import { AdminToolbarCount } from "@/components/admin/AdminToolbarCount";

function formatSubscribedAt(d: Date) {
	return d.toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

export default async function AdminNewsletterPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { authorized } = await checkPermission(PERMISSIONS.MANAGE_USERS);

	if (!authorized) {
		return <AccessDenied requiredPermission="canManageUsers" />;
	}

	const params = await searchParams;
	const page = parseInt(params.page as string) || 1;
	const search = (params.search as string) || "";
	const limit = 30;
	const skip = (page - 1) * limit;

	const [subscribers, total] = await getCachedNewsletterSubscribers(
		search,
		skip,
		limit,
	);

	const totalPages = Math.max(1, Math.ceil(total / limit));

	return (
		<AdminListPageShell
			title="Newsletter"
			description="Public signups from the site (unique emails)."
			toolbarTitle="Search & filters"
			toolbar={
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
					<div className="w-full max-w-md min-w-0">
						<AdminSearch
							placeholder="Search by email…"
							className="max-w-none shadow-none"
						/>
					</div>
					<AdminToolbarCount count={total} unit="subscribers" />
				</div>
			}
		>
			<div className="overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-zinc-900">
				<div className="w-full overflow-x-auto">
				<Table className="min-w-[520px]">
					<TableHeader>
						<TableRow>
							<TableHead>Email</TableHead>
							<TableHead className="w-[200px]">Subscribed</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{subscribers.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={2}
									className="py-12 text-center text-sm text-muted-foreground"
								>
									No subscribers yet.
								</TableCell>
							</TableRow>
						) : (
							subscribers.map((row: NewsletterSubscriber) => (
								<TableRow key={row.id}>
									<TableCell className="font-mono text-sm">{row.email}</TableCell>
									<TableCell className="text-muted-foreground text-sm">
										{formatSubscribedAt(row.createdAt)}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
				</div>
			</div>

			<AdminPagination totalPages={totalPages} currentPage={page} />
		</AdminListPageShell>
	);
}
