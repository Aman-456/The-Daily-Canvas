import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminNavbar } from "@/components/admin/AdminNavbar"
import { isAdminOrSubAdmin } from "@/lib/utils"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const role = session?.user?.role || "USER"

  if (!session?.user) {
    redirect("/api/auth/signin")
  }

  if (!isAdminOrSubAdmin(role)) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 flex flex-col md:flex-row">
      <AdminSidebar user={session.user} />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="hidden md:block">
          <AdminNavbar user={session.user} />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
