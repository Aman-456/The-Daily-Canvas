// src/components/admin/AdminNavbar.tsx
import { UserNav } from "@/components/client/UserNav";
import { ThemeToggle } from "@/components/client/ThemeToggle";
import { AdminNotifications } from "@/components/admin/AdminNotifications";

export function AdminNavbar({ user }: { user: any }) {
	return (
		<header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-zinc-950/70 border-b border-gray-200 dark:border-zinc-800">
			<div className="flex h-16 items-center px-4 md:px-6 justify-end">
				<div className="flex items-center gap-2 sm:gap-4">
					<ThemeToggle />
					<AdminNotifications />
					<UserNav user={user} />
				</div>
			</div>
		</header>
	);
}
