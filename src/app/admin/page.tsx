import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

import { getCachedStats } from "@/actions/dashboard";
import { checkPermission, PERMISSIONS } from "@/lib/permissions";



export default async function AdminDashboardPage() {
  const { session, authorized } = await checkPermission(PERMISSIONS.SEE_STATS)

  if (!authorized) {
    redirect("/admin/blogs");
  }

  const [usersCount, blogsCount, commentsCount] = await getCachedStats(
    session?.user?.id,
    session?.user?.role,
    session?.user?.permissions
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description={
          <>
            Welcome back, {session?.user?.name || "Admin"}. Here&apos;s an overview of your platform.
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blogs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blogsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commentsCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
