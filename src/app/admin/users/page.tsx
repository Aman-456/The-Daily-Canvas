import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserRoleSelect } from "@/components/admin/UserRoleSelect";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { isAdmin, hasExtraPermissions } from "@/lib/utils";
import { getCachedUsers } from "@/actions/user";
import { checkPermission, PERMISSIONS } from "@/lib/permissions";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { UserPermissionsModal } from "@/components/admin/UserPermissionsModal";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { ToggleUserDisabledButton } from "@/components/admin/ToggleUserDisabledButton";
import { AdminListPageShell } from "@/components/admin/AdminListPageShell";
import { AdminToolbarCountLabeled } from "@/components/admin/AdminToolbarCount";

export default async function AdminUsersPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { session, authorized } = await checkPermission(PERMISSIONS.MANAGE_USERS);

	if (!authorized) {
		return <AccessDenied requiredPermission="canManageUsers" />;
	}

	const params = await searchParams;
	const page = parseInt(params.page as string) || 1;
	const search = (params.search as string) || "";
	const status = ((params.status as string) || "all") as "all" | "active" | "disabled";
	const sort = ((params.sort as string) || "joined_desc") as
		| "joined_desc"
		| "joined_asc"
		| "name_asc"
		| "email_asc";
	const limit = 20;
	const skip = (page - 1) * limit;
	const [users, total] = (await getCachedUsers(search, skip, limit, status, sort)) as [
		any[],
		number,
	];

	const totalPages = Math.ceil(total / limit);

	return (
		<AdminListPageShell
			title="Users"
			description="View all users and sub-admins."
			toolbar={
				<div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between xl:gap-6">
					<div className="flex min-w-0 flex-1 flex-col gap-4 xl:flex-row xl:items-end xl:gap-6">
						<div className="w-full min-w-0 xl:max-w-md xl:flex-1">
							<AdminSearch
								placeholder="Search name or email…"
								className="max-w-none shadow-none"
							/>
						</div>
						<AdminFilters
							className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-3"
							filters={[
								{
									key: "status",
									label: "Status",
									defaultValue: "all",
									options: [
										{ value: "all", label: "All" },
										{ value: "active", label: "Active" },
										{ value: "disabled", label: "Disabled" },
									],
								},
								{
									key: "sort",
									label: "Sort by",
									defaultValue: "joined_desc",
									options: [
										{ value: "joined_desc", label: "Joined (newest)" },
										{ value: "joined_asc", label: "Joined (oldest)" },
										{ value: "name_asc", label: "Name (A→Z)" },
										{ value: "email_asc", label: "Email (A→Z)" },
									],
								},
							]}
						/>
					</div>
					<AdminToolbarCountLabeled label="Total users" value={total} />
				</div>
			}
		>
			<div className="overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-zinc-900">
				<div className="w-full overflow-x-auto">
					<Table className="min-w-[720px]">
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Role</TableHead>
							<TableHead className="w-[100px]">Joined</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.map((user: any) => (
							<TableRow key={user.id.toString()}>
								<TableCell className="flex items-center gap-3">
									<Avatar>
										<AvatarImage src={user.image} />
										<AvatarFallback>
											{user.name?.charAt(0) || "U"}
										</AvatarFallback>
									</Avatar>
									<div className="flex flex-col">
										<span className="font-medium flex items-center gap-2">
											{user.name}
											{hasExtraPermissions(user) && (
												<Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
													Extra Perms
												</Badge>
											)}
										</span>
									</div>
								</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										{user.isDisabled ? (
											<Badge variant="secondary">Disabled</Badge>
										) : (
											<Badge className="bg-emerald-500 hover:bg-emerald-600">
												Active
											</Badge>
										)}
										{isAdmin(session?.user?.role) && (
											<ToggleUserDisabledButton
												userId={user.id.toString()}
												isDisabled={!!user.isDisabled}
											/>
										)}
									</div>
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-1">
										{isAdmin(session?.user?.role) && (
											<UserRoleSelect
												userId={user.id.toString()}
												currentRole={user.role}
												disabled={user.id.toString() === session?.user?.id}
											/>
										)}
										{user.role === "USER" && isAdmin(session?.user?.role) && (
											<UserPermissionsModal user={JSON.parse(JSON.stringify(user))} />
										)}
										{isAdmin(session?.user?.role) && (
											<DeleteUserButton userId={user.id.toString()} userName={user.name} />
										)}
									</div>
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
									colSpan={5}
									className="text-center h-24 text-muted-foreground"
								>
									No users found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
				</div>
			</div>

			<AdminPagination totalPages={totalPages} currentPage={page} />
		</AdminListPageShell>
	);
}
