import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

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

  if (role !== "ADMIN" && role !== "SUBADMIN") {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 flex flex-col md:flex-row">
      <AdminSidebar role={role} />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        {children}
      </main>
    </div>
  )
}
