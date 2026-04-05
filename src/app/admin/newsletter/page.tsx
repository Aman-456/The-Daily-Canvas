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
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Newsletter</h1>
					<p className="text-muted-foreground">
						Public signups from the site (unique emails).
					</p>
				</div>
				<div className="rounded-lg border border-primary/10 bg-primary/5 px-4 py-2">
					<p className="text-sm font-medium text-primary">
						Subscribers: {total}
					</p>
				</div>
			</div>

			<div className="flex items-center justify-between gap-4">
				<AdminSearch placeholder="Search by email…" />
			</div>

			<div className="rounded-lg border bg-white shadow-sm dark:bg-zinc-900">
				<Table>
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

			<AdminPagination totalPages={totalPages} currentPage={page} />
		</div>
	);
}
