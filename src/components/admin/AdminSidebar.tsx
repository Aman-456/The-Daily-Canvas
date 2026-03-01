"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function AdminSidebar({ role }: { role: string }) {
	const [open, setOpen] = useState(false);

	const NavLinks = () => (
		<>
			<Link
				href="/admin"
				onClick={() => setOpen(false)}
				className="text-sm font-medium hover:text-primary transition-colors block py-2"
			>
				Dashboard
			</Link>
			<Link
				href="/admin/blogs"
				onClick={() => setOpen(false)}
				className="text-sm font-medium hover:text-primary transition-colors block py-2"
			>
				Blogs
			</Link>
			<Link
				href="/admin/comments"
				onClick={() => setOpen(false)}
				className="text-sm font-medium hover:text-primary transition-colors block py-2"
			>
				Comments
			</Link>
			{role === "ADMIN" && (
				<Link
					href="/admin/users"
					onClick={() => setOpen(false)}
					className="text-sm font-medium hover:text-primary transition-colors block py-2"
				>
					Users
				</Link>
			)}
			<Link
				href="/"
				className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors block mt-6 py-2"
			>
				&larr; Back to Site
			</Link>
		</>
	);

	return (
		<>
			{/* Mobile Topbar */}
			<div className="md:hidden flex items-center justify-between bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 p-4 shrink-0">
				<h2 className="font-bold text-lg text-foreground">Admin Panel</h2>
				<button
					onClick={() => setOpen(!open)}
					className="p-2 -mr-2 text-foreground"
				>
					{open ? <X size={24} /> : <Menu size={24} />}
				</button>
			</div>

			{/* Mobile Menu Overlay */}
			{open && (
				<div className="md:hidden fixed inset-x-0 top-[69px] bottom-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm z-50 p-6 shadow-md border-b">
					<nav className="flex flex-col space-y-4">
						<NavLinks />
					</nav>
				</div>
			)}

			{/* Desktop Sidebar */}
			<aside className="hidden md:flex flex-col w-64 shrink-0 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 p-6 shadow-sm min-h-screen">
				<h2 className="text-xl font-bold mb-10 text-foreground tracking-tight">
					Admin Panel
				</h2>
				<nav className="flex flex-col space-y-4">
					<NavLinks />
				</nav>
			</aside>
		</>
	);
}
