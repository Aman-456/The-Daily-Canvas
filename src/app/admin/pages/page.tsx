import Link from "next/link";
import type { InferSelectModel } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pages } from "@/db/schema";
import { getAdminPages } from "@/actions/page";
import { checkPermission, PERMISSIONS } from "@/lib/permissions";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { AdminListPageShell } from "@/components/admin/AdminListPageShell";
import { AdminToolbarCount } from "@/components/admin/AdminToolbarCount";

type PageRow = InferSelectModel<typeof pages>;

export default async function AdminPagesPage() {
	const { authorized } = await checkPermission(PERMISSIONS.MANAGE_PAGES);

	if (!authorized) {
		return <AccessDenied requiredPermission="canManagePages" />;
	}

	const result = await getAdminPages();
	const rows: PageRow[] = result.success && result.data ? result.data : [];

	return (
		<AdminListPageShell
			title="Manage Pages"
			description="Edit Privacy, Terms, FAQ, Changelog, and other CMS-backed pages."
			toolbarTitle="Overview"
			toolbar={<AdminToolbarCount count={rows.length} unit="pages" />}
		>
			<div className="overflow-x-auto rounded-lg border bg-white shadow-sm dark:bg-zinc-900">
				<Table className="min-w-[640px]">
					<TableHeader>
						<TableRow>
							<TableHead>Title</TableHead>
							<TableHead>Slug</TableHead>
							<TableHead>Last Updated</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((page) => (
							<TableRow key={page.id.toString()}>
								<TableCell className="font-medium">{page.title}</TableCell>
								<TableCell className="text-muted-foreground">{page.slug}</TableCell>
								<TableCell>{new Date(page.updatedAt).toLocaleDateString()}</TableCell>
								<TableCell className="space-x-2 text-right">
									<Link href={`/${page.slug}`} target="_blank">
										<Button variant="outline" size="sm">
											View
										</Button>
									</Link>
									<Link href={`/admin/pages/${page.slug}/edit`}>
										<Button variant="outline" size="sm">
											Edit
										</Button>
									</Link>
								</TableCell>
							</TableRow>
						))}
						{rows.length === 0 && (
							<TableRow>
								<TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
									No pages found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</AdminListPageShell>
	);
}
