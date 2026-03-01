import { auth } from "@/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"
import Blog from "@/models/Blog"
import Comment from "@/models/Comment"

export default async function AdminDashboardPage() {
  const session = await auth()
  await dbConnect()

  const [usersCount, blogsCount, commentsCount] = await Promise.all([
    User.countDocuments(),
    Blog.countDocuments(),
    Comment.countDocuments(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name || "Admin"}. Here's an overview of your platform.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
