import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminPages } from "@/actions/page";

export default async function AdminPagesPage() {
	const result = await getAdminPages();
	const pages = result.success ? result.data : [];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Manage Pages</h1>
					<p className="text-muted-foreground">
						Edit dynamic pages like Privacy Policy and Terms of Service.
					</p>
				</div>
			</div>

			<div className="bg-white dark:bg-zinc-900 border rounded-lg shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Title</TableHead>
							<TableHead>Slug</TableHead>
							<TableHead>Last Updated</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{pages.map((page: any) => (
							<TableRow key={page._id.toString()}>
								<TableCell className="font-medium">{page.title}</TableCell>
								<TableCell className="text-muted-foreground">{page.slug}</TableCell>
								<TableCell>
									{new Date(page.updatedAt).toLocaleDateString()}
								</TableCell>
								<TableCell className="text-right space-x-2">
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
						{pages.length === 0 && (
							<TableRow>
								<TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
									No pages found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
