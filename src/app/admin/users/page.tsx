import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRoleSelect } from "@/components/admin/UserRoleSelect";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { isAdmin } from "@/lib/utils";
import { getCachedUsers } from "@/actions/user";

export default async function AdminUsersPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const session = await auth();
	// Session and Admin check handled by layout.tsx

	const params = await searchParams;
	const page = parseInt(params.page as string) || 1;
	const search = (params.search as string) || "";
	const limit = 20;
	const skip = (page - 1) * limit;

	let query: any = {};
	if (search) {
		query = {
			$or: [
				{ name: { $regex: search, $options: "i" } },
				{ email: { $regex: search, $options: "i" } },
			],
		};
	}

	const [users, total] = await getCachedUsers(query, skip, limit);

	const totalPages = Math.ceil(total / limit);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Users</h1>
					<p className="text-muted-foreground">
						View all users and sub-admins.
					</p>
				</div>
				<div className="bg-primary/5 px-4 py-2 rounded-lg border border-primary/10">
					<p className="text-sm font-medium text-primary">
						Total Users: {total}
					</p>
				</div>
			</div>

			<div className="flex items-center justify-between gap-4">
				<AdminSearch placeholder="Search name or email..." />
			</div>

			<div className="bg-white dark:bg-zinc-900 border rounded-lg shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Joined</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.map((user: any) => (
							<TableRow key={user._id.toString()}>
								<TableCell className="flex items-center gap-3">
									<Avatar>
										<AvatarImage src={user.image} />
										<AvatarFallback>
											{user.name?.charAt(0) || "U"}
										</AvatarFallback>
									</Avatar>
									<span className="font-medium">{user.name}</span>
								</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>
									<UserRoleSelect
										userId={user._id.toString()}
										currentRole={user.role}
										disabled={user._id.toString() === session?.user?.id}
									/>
								</TableCell>
								<TableCell>
									{user.createdAt
										? new Date(user.createdAt).toLocaleDateString()
										: "N/A"}
								</TableCell>
							</TableRow>
						))}
						{users.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={4}
									className="text-center h-24 text-muted-foreground"
								>
									No users found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<AdminPagination totalPages={totalPages} currentPage={page} />
		</div>
	);
}
